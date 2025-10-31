import { z } from 'zod'
import { hashApiKey, generateApiKey, generateRandomString } from '~~/server/utils/crypto'

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(['log:write', 'heartbeat:write', 'deployment:write', 'monitor:read', 'monitor:write'])).min(1),
  expiresAt: z.string().datetime().optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)

  const body = await readBody(event)
  const data = apiKeySchema.parse(body)

  try {
    // Generate API key with secure random prefix
    const randomPrefix = generateRandomString(8)
    const keyPrefix = `hs_${randomPrefix}_`
    const apiKey = generateApiKey(keyPrefix)
    const keyHash = hashApiKey(apiKey)

    // Create API key document
    const apiKeyDoc = await ApiKey.create({
      projectId: project._id,
      userId: session.user._id,
      name: data.name,
      keyHash,
      keyPrefix,
      permissions: data.permissions,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: true
    })

    // Return the plain text key only once (won't be shown again)
    return {
      success: true,
      data: {
        id: apiKeyDoc._id,
        name: apiKeyDoc.name,
        key: apiKey, // Show only on creation
        keyPrefix,
        permissions: apiKeyDoc.permissions,
        expiresAt: apiKeyDoc.expiresAt,
        createdAt: apiKeyDoc.createdAt
      },
      message: 'API key created successfully. Save this key securely - it will not be shown again.'
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid API key data' })
    }
    console.error('Error creating API key:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
