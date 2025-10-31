import { z } from 'zod'
import crypto from 'crypto'

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(['log:write', 'heartbeat:write', 'deployment:write', 'monitor:read', 'monitor:write'])).min(1),
  expiresAt: z.string().datetime().optional()
})

// Generate a secure random API key
function generateApiKey(prefix: string): string {
  const randomPart = crypto.randomBytes(32).toString('hex')
  return `${prefix}${randomPart}`
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)
  
  const body = await readBody(event)
  const data = apiKeySchema.parse(body)

  try {
    // Generate API key with project-specific prefix
    const keyPrefix = `hs_${project._id.toString().substring(0, 8)}_`
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
