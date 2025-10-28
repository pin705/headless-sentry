import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  // 2. 🧠 Kiểm tra tài khoản (ẩn lỗi cụ thể)
  const user = await User.findOne({ email }).lean()
  const isValid = user && (await verifyPassword(user.password, password))

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Thông tin không chính xác'
    })
  }

  const character = await Character.findOne({ userId: user._id })

  // 3. 🔐 Thiết lập phiên đăng nhập
  await setUserSession(event, {
    user: {
      email,
      userId: user._id
    },
    character,
    loggedInAt: Date.now()
  })

  return setResponseStatus(event, 201)
})
