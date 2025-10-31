export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)

  try {
    const dashboards = await Dashboard.find({
      projectId: project._id,
      userId: session.user._id
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return {
      success: true,
      data: dashboards
    }
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
