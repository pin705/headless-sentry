import { z } from 'zod'
import crypto from 'crypto'

const deploymentSchema = z.object({
  version: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  environment: z.enum(['production', 'staging', 'development']).optional(),
  deployedBy: z.string().max(100).optional(),
  status: z.enum(['success', 'failed', 'rollback']).optional(),
  metadata: z.record(z.any()).optional()
})

// Helper to hash API key
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'projectId')
  
  // Check if user is authenticated OR has valid API key
  let project
  const apiKey = getHeader(event, 'x-api-key') || getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (apiKey) {
    // API key authentication
    const keyHash = hashApiKey(apiKey)
    const apiKeyDoc = await ApiKey.findOne({
      keyHash,
      isActive: true,
      projectId,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })

    if (!apiKeyDoc || !apiKeyDoc.permissions.includes('deployment:write')) {
      throw createError({ statusCode: 403, message: 'Invalid API key or insufficient permissions' })
    }

    project = await Project.findById(projectId)
    
    // Update last used timestamp
    apiKeyDoc.lastUsedAt = new Date()
    await apiKeyDoc.save()
  } else {
    // Session authentication
    project = await requireProjectMembership(event)
  }

  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const body = await readBody(event)
  const data = deploymentSchema.parse(body)

  try {
    const deployment = await Deployment.create({
      projectId: project._id,
      timestamp: new Date(),
      version: data.version,
      description: data.description || '',
      environment: data.environment || 'production',
      deployedBy: data.deployedBy || 'CI/CD',
      status: data.status || 'success',
      metadata: data.metadata || {}
    })

    return {
      success: true,
      data: deployment,
      message: 'Deployment recorded successfully'
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid deployment data' })
    }
    console.error('Error recording deployment:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
