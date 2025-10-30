export default defineEventHandler(async (event) => {
  // 1. Kiểm tra quyền truy cập project
  const project = await requireProjectMembership(event, { lean: true })

  // 2. Lấy danh sách thành viên (populate thông tin user)
  const projectWithMembers = await Project.findById(project._id)
    .populate('members.userId', 'name email')
    .select('members')
    .lean()

  // 3. Lấy danh sách lời mời đang chờ
  const pendingInvites = await Invitation.find({ projectId: project._id }).lean()

  return {
    members: projectWithMembers?.members || [],
    pendingInvites: pendingInvites
  }
})
