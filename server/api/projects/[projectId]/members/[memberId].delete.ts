import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const currentUserId = new mongoose.Types.ObjectId(session.user.userId)
  const memberIdToDelete = getRouterParam(event, 'memberId')

  if (!mongoose.Types.ObjectId.isValid(memberIdToDelete)) {
    throw createError({ statusCode: 400, message: 'Member ID không hợp lệ' })
  }

  const project = await requireProjectMembership(event, { lean: false })
  requireProjectRole(project, currentUserId, ['owner', 'admin'])

  const memberToDelete = project.members.id(memberIdToDelete)
  if (!memberToDelete) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy thành viên' })
  }
  if (memberToDelete.role === 'owner') {
    throw createError({ statusCode: 403, message: 'Không thể xóa Owner khỏi dự án' })
  }

  // Sử dụng .pull() để xóa sub-document khỏi mảng
  project.members.pull(memberIdToDelete)
  await project.save()

  return { success: true }
})
