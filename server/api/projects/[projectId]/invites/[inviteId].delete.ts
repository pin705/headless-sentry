import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const currentUserId = new mongoose.Types.ObjectId(session.user.userId)
  const inviteIdToDelete = getRouterParam(event, 'inviteId')

  if (!mongoose.Types.ObjectId.isValid(inviteIdToDelete)) {
    throw createError({ statusCode: 400, message: 'Invite ID không hợp lệ' })
  }

  // Kiểm tra quyền (phải là admin/owner của project)
  const project = await requireProjectMembership(event)
  requireProjectRole(project, currentUserId, ['owner', 'admin'])

  // Tìm và xóa invitation
  const invite = await Invitation.findOneAndDelete({
    _id: inviteIdToDelete,
    projectId: project._id // Đảm bảo invite này thuộc project
  })

  if (!invite) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy lời mời' })
  }

  return { success: true }
})
