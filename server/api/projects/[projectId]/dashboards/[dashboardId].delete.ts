import { validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)
  const dashboardId = getRouterParam(event, 'dashboardId')
  const dashboardIdObj = validateObjectId(dashboardId, 'Dashboard ID')

  try {
    const dashboard = await Dashboard.findOneAndDelete({
      _id: dashboardIdObj,
      projectId: project._id,
      userId: session.user._id
    })

    if (!dashboard) {
      throw createError({ statusCode: 404, message: 'Dashboard not found' })
    }

    return {
      success: true,
      message: 'Dashboard deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
