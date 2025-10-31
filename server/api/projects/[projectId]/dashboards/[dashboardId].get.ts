import { validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)
  const dashboardId = getRouterParam(event, 'dashboardId')
  const dashboardIdObj = validateObjectId(dashboardId, 'Dashboard ID')

  try {
    const dashboard = await Dashboard.findOne({
      _id: dashboardIdObj,
      projectId: project._id,
      userId: session.user._id
    }).lean()

    if (!dashboard) {
      throw createError({ statusCode: 404, message: 'Dashboard not found' })
    }

    return {
      success: true,
      data: dashboard
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
