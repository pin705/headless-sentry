export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)

  try {
    const apiKeys = await ApiKey.find({ projectId: project._id })
      .select('-keyHash') // Don't expose the hash
      .sort({ createdAt: -1 })
      .lean()

    return {
      success: true,
      data: apiKeys
    }
  } catch (error) {
    console.error('Error fetching API keys:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
