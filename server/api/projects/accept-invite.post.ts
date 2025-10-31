export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await getUserSession(event)
  const user = session.user

  if (!user || !('userId' in user)) {
    throw createError({ statusCode: 401, message: 'Bạn cần đăng nhập để chấp nhận lời mời' })
  }

  const { token } = await readBody(event)
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token là bắt buộc' })
  }

  // 1. Tìm lời mời
  const invite = await Invitation.findOne({ token })
  if (!invite) {
    throw createError({ statusCode: 404, message: 'Lời mời không hợp lệ hoặc đã hết hạn' })
  }

  // 2. Kiểm tra email
  const userEmail = (user && 'email' in user) ? String(user.email) : ''
  const userId = (user && 'userId' in user) ? String(user.userId) : ''

  if (!userEmail || !userId) {
    throw createError({ statusCode: 401, message: 'Thông tin người dùng không hợp lệ' })
  }

  if (String(invite.email) !== userEmail) {
    throw createError({ statusCode: 403, message: `Lời mời này dành cho ${invite.email}, không phải ${userEmail}` })
  }

  // 3. Tìm project
  const project = await Project.findById(invite.projectId)
  if (!project) {
    throw createError({ statusCode: 404, message: 'Dự án không còn tồn tại' })
  }

  // 4. Kiểm tra xem đã là thành viên chưa
  const isAlreadyMember = project.members.some(m => String(m.userId) === userId)
  if (isAlreadyMember) {
    // Đã là thành viên, chỉ cần xóa invite
    await Invitation.findByIdAndDelete(invite._id)

    // Gửi mail thông báo đã là thành viên
    try {
      const dashboardUrl = `${config.public.appUrl}/projects/${project._id}`
      const emailTemplate = createAlreadyMemberNotificationTemplate(
        userEmail,
        String(project.name),
        dashboardUrl
      )

      await sendMail(
        {
          to: userEmail,
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
    } catch (e) {
      console.error('Lỗi gửi mail (đã là thành viên):', e)
    }

    return { success: true, message: 'Bạn đã là thành viên', projectId: project._id }
  }

  // 5. Thêm vào team (tạm thời bỏ qua type checking để avoid conflicts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(project.members as any[]).push({
    userId: userId,
    email: userEmail,
    role: String(invite.role)
  })

  await project.save()

  // 6. Xóa lời mời
  await Invitation.findByIdAndDelete(invite._id)

  // 7. Gửi mail chào mừng
  try {
    const dashboardUrl = `${config.public.appUrl}/projects/${project._id}`
    const emailTemplate = createWelcomeNewMemberTemplate(
      userEmail,
      String(project.name),
      String(invite.role),
      dashboardUrl
    )

    await sendMail(
      {
        to: userEmail,
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

    console.log(`Email chào mừng đã được gửi đến: ${userEmail}`)
  } catch (e) {
    console.error('Lỗi gửi mail (chào mừng):', e)
  }

  return { success: true, message: 'Chào mừng bạn vào team!', projectId: project._id }
})
