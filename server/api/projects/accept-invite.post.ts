import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const user = session.user

  if (!user?.userId) {
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
  if (invite.email !== user.email) {
    throw createError({ statusCode: 403, message: `Lời mời này dành cho ${invite.email}, không phải ${user.email}` })
  }

  // 3. Tìm project
  const project = await Project.findById(invite.projectId)
  if (!project) {
    throw createError({ statusCode: 404, message: 'Dự án không còn tồn tại' })
  }

  // 4. Kiểm tra xem đã là thành viên chưa
  const isAlreadyMember = project.members.some(m => m.userId.equals(user.userId))
  if (isAlreadyMember) {
    // Đã là thành viên, chỉ cần xóa invite
    await Invitation.findByIdAndDelete(invite._id)
    return { success: true, message: 'Bạn đã là thành viên', projectId: project._id }
  }

  // 5. Thêm vào team
  project.members.push({
    userId: new mongoose.Types.ObjectId(user.userId),
    email: user.email,
    role: invite.role
  })

  await project.save()

  // 6. Xóa lời mời
  await Invitation.findByIdAndDelete(invite._id)

  return { success: true, message: 'Chào mừng bạn vào team!', projectId: project._id }
})
