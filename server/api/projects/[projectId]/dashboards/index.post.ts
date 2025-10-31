import { z } from 'zod'

const layoutItemSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number()
})

const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['uptime', 'latency', 'errorRate', 'sslStatus', 'recentChecks']),
  monitorId: z.string(),
  title: z.string().optional(),
  config: z.record(z.any()).optional()
})

const dashboardSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
  layoutConfig: z.array(layoutItemSchema).optional(),
  widgetConfigs: z.array(widgetConfigSchema).optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)
  
  const body = await readBody(event)
  const data = dashboardSchema.parse(body)

  try {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await Dashboard.updateMany(
        { projectId: project._id, userId: session.user._id },
        { $set: { isDefault: false } }
      )
    }

    const dashboard = await Dashboard.create({
      userId: session.user._id,
      projectId: project._id,
      name: data.name,
      isDefault: data.isDefault || false,
      layoutConfig: data.layoutConfig || [],
      widgetConfigs: data.widgetConfigs || []
    })

    return {
      success: true,
      data: dashboard
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid dashboard data' })
    }
    console.error('Error creating dashboard:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
