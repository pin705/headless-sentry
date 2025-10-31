import { z } from 'zod'
import { validateObjectId } from '~~/server/utils/validation'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const keyId = getRouterParam(event, 'keyId')
  const keyIdObj = validateObjectId(keyId, 'API Key ID')
  
  const body = await readBody(event)
  const data = updateSchema.parse(body)

  try {
    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: keyIdObj, projectId: project._id },
      { $set: data },
      { new: true }
    ).select('-keyHash').lean()

    if (!apiKey) {
      throw createError({ statusCode: 404, message: 'API key not found' })
    }

    return {
      success: true,
      data: apiKey
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid API key data' })
    }
    console.error('Error updating API key:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
