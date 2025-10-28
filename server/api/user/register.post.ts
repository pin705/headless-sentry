import { z } from 'zod'

// Validate form
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  // const body = await readBody(event);
  const body = await readValidatedBody(event, bodySchema.parse)
  const { email, password } = body

  // 3. Check nếu email đã tồn tại
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw createError({ statusCode: 400, message: '📧 Email hoặc tên đăng nhập đã tồn tại.' })
  }

  // 5. Hash và lưu thông tin
  const hashedPassword = await hashPassword(password)
  const user = new User({
    email: email.trim(),
    password: hashedPassword,
  })

  await user.save()

  // 7. Set session
  await setUserSession(event, {
    user: {
      email
    },
    loggedInAt: Date.now()
  })

  return true
})
