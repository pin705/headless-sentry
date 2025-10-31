import { validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const keyId = getRouterParam(event, 'keyId')
  const keyIdObj = validateObjectId(keyId, 'API Key ID')

  try {
    const apiKey = await ApiKey.findOneAndDelete({
      _id: keyIdObj,
      projectId: project._id
    })

    if (!apiKey) {
      throw createError({ statusCode: 404, message: 'API key not found' })
    }

    return {
      success: true,
      message: 'API key deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting API key:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
