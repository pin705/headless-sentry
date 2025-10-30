import mongoose from 'mongoose'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const currentUserId = new mongoose.Types.ObjectId(session.user.userId)

  // 1. Kiểm tra quyền (phải là admin/owner mới được mời)
  const project = await requireProjectMembership(event) //
  requireProjectRole(project, currentUserId, ['owner', 'admin']) //

  const { email, role } = await readBody(event)
  if (!email || !['admin', 'member'].includes(role)) {
    throw createError({ statusCode: 400, message: 'Email và vai trò là bắt buộc' })
  }

  // 2. Kiểm tra xem user đã là thành viên chưa
  const isAlreadyMember = project.members.some((m: any) => m.email === email)
  if (isAlreadyMember) {
    throw createError({ statusCode: 409, message: 'Người dùng này đã là thành viên' })
  }

  // 3. Kiểm tra xem đã mời user này chưa
  const existingInvite = await Invitation.findOne({ projectId: project._id, email })
  if (existingInvite) {
    throw createError({ statusCode: 409, message: 'Lời mời đã được gửi đến email này' })
  }

  // 4. Tạo lời mời
  const token = crypto.randomBytes(32).toString('hex')
  const newInvite = new Invitation({
    projectId: project._id,
    email: email,
    role: role,
    token: token,
    invitedBy: currentUserId
  })

  await newInvite.save()

  // (Tại đây, bạn nên thêm logic gửi email với link: `/accept-invite?token=${token}`)

  return { success: true, message: `Đã gửi lời mời đến ${email}` }
})
