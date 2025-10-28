import { getRequestHeader } from 'h3'
import { z } from 'zod'

function getRealIP(event) {
  const headers = event.node.req.headers
  return (
    headers['cf-connecting-ip'] // Cloudflare
    || headers['x-real-ip'] // NGINX
    || headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.node.req.socket?.remoteAddress
    || 'unknown'
  )
}

// Validate form
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  captchaToken: z.string() // from client
})

export default defineEventHandler(async (event) => {
  // const body = await readBody(event);
  const body = await readValidatedBody(event, bodySchema.parse)
  const { email, password, captchaToken } = body
  const ip = getRealIP(event)
  console.log('ip', ip)

  const ua = getRequestHeader(event, 'user-agent') || 'unknown'

  // 2. Rate limit theo IP – không quá 5 account mỗi giờ
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await User.countDocuments({
    createdAt: { $gte: oneHourAgo },
    lastKnownIP: ip
  })

  if (recentCount > 5) {
    throw createError({
      statusCode: 429,
      message:
        '⏳ Quá nhiều tài khoản được tạo từ địa chỉ IP này. Vui lòng thử lại sau.'
    })
  }

  // 3. Check nếu email đã tồn tại
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw createError({ statusCode: 400, message: '📧 Email đã tồn tại.' })
  }

  // 4. Check user-agent bất thường
  if (!ua || ua.includes('curl') || ua.includes('bot')) {
    throw createError({
      statusCode: 403,
      message: '🚫 Trình duyệt không hợp lệ.'
    })
  }

  // 5. Hash và lưu thông tin
  const hashedPassword = await hashPassword(password)
  const user = new User({
    email: email.trim(),
    password: hashedPassword,
    lastKnownIP: ip,
    userAgent: ua
  })

  const newUser = await user.save()

  // 6. Tạo nhân vật mặc định nếu chưa có
  const exists = await Character.findOne({ userId: newUser._id })
  if (!exists) {
    // const newCharacter = await Character.create({
    //   userId: newUser._id,
    //   name: 'Người chơi',
    //   realm: 'Luyện Khí Tầng 1',
    //   exp: 0
    // })

    // =======================================================================
    // THÊM MỚI: Logic Gửi quà Tân Thủ
    // =======================================================================
    const mailTitle = 'Quà Chào Mừng Tân Thủ'
    const mailContent = `
      <p>Chào mừng đạo hữu đã đến với thế giới Tu Chân.</p>
      <p>Thiên Đạo xin gửi tặng một phần quà khởi đầu để trợ giúp trên con đường tu tiên đầy chông gai. Chúc đạo hữu sớm ngày đắc đạo!</p>
    `
    const attachments = [
      { type: 'currency', itemId: 'spiritStone', quantity: 50_000_000 },
      { type: 'currency', itemId: 'towerToken', quantity: 150_000_000 }
    ]

    // Gọi hàm gửi thư
    // await sendSystemMail(newCharacter._id.toString(), mailTitle, mailContent, attachments)
    // =======================================================================
  }

  // 7. Set session
  await setUserSession(event, {
    user: {
      email
    },
    loggedInAt: Date.now()
  })

  return true
})
