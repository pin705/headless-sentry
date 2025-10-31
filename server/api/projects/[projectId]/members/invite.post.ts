import mongoose from 'mongoose'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig() // <-- THÊM MỚI
  const session = await getUserSession(event)
  const currentUserId = new mongoose.Types.ObjectId(session.user.userId)
  const user = session.user

  // 1. Kiểm tra quyền (phải là admin/owner mới được mời)
  const project = await requireProjectMembership(event)
  requireProjectRole(project, currentUserId, ['owner', 'admin'])

  const { email, role } = await readBody(event)
  if (!email || !['admin', 'member'].includes(role)) {
    throw createError({ statusCode: 400, message: 'Email và vai trò là bắt buộc' })
  }

  // 2. Kiểm tra xem user đã là thành viên chưa
  const projectDetails = await Project.findById(project._id).lean() // Lấy chi tiết project
  if (!projectDetails) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy dự án' })
  }

  const isAlreadyMember = projectDetails.members.some((m: any) => m.email === email)
  if (isAlreadyMember) {
    throw createError({ statusCode: 409, message: 'Người dùng này đã là thành viên' })
  }

  // 3. Kiểm tra xem đã mời user này chưa (và xóa lời mời cũ nếu có)
  await Invitation.deleteMany({ projectId: project._id, email })

  // 4. Tạo lời mời mới
  const token = crypto.randomBytes(32).toString('hex')
  const newInvite = new Invitation({
    projectId: project._id,
    email: email,
    role: role,
    token: token,
    invitedBy: currentUserId
  })

  await newInvite.save()

  // 5. --- THÊM MỚI: Gửi Email Mời ---
  const acceptUrl = `${config.public.appUrl}/accept-invite?token=${token}`

  try {
    // Tạo email template với design chuyên nghiệp
    const inviterName = (user && 'email' in user) ? String(user.email) : 'Admin'
    const emailTemplate = createMemberInvitedEmailTemplate(
      email,
      String(projectDetails.name),
      inviterName,
      role,
      acceptUrl
    )

    // Gửi email
    await sendMail(
      {
        to: email,
        from: config.email.from || 'noreply@headless-sentry.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html
      },
      {
        host: config.email.host,
        port: Number(config.email.port),
        secure: config.email.secure || false,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      }
    )

    console.log(`Email mời thành viên đã được gửi đến: ${email}`)
  } catch (e) {
    console.error('Lỗi gửi mail (mời):', e)
    // Dù gửi mail lỗi, vẫn trả về thành công (vì đã tạo invite)
    // Bạn có thể xử lý kỹ hơn ở đây nếu muốn
  }
  // --- KẾT THÚC GỬI MAIL ---

  return { success: true, message: `Đã gửi lời mời đến ${email}` }
})
