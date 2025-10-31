import { getRequireUserSession, validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = await getRequireUserSession(event)
  const projectId = getRouterParam(event, 'projectId')
  const projectIdObj = validateObjectId(projectId, 'Project ID')

  try {
    // Tìm project theo ID
    const project = await Project.findById(projectIdObj)
      .lean()

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy Project' })
    }

    // Kiểm tra quyền: User có phải là thành viên không?
    const isMember = project.members.some(member => member.userId.equals(userId))
    if (!isMember) {
      throw createError({ statusCode: 403, message: 'Bạn không có quyền truy cập Project này' })
    }

    return project
  } catch (error: any) {
    console.error(`Lỗi lấy chi tiết project ${projectId}:`, error)
    if (error.statusCode === 404 || error.statusCode === 403) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
