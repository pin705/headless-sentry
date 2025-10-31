import { z } from 'zod'
import { validateObjectId } from '~~/server/utils/validation'

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

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  layoutConfig: z.array(layoutItemSchema).optional(),
  widgetConfigs: z.array(widgetConfigSchema).optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)
  const dashboardId = getRouterParam(event, 'dashboardId')
  const dashboardIdObj = validateObjectId(dashboardId, 'Dashboard ID')
  
  const body = await readBody(event)
  const data = updateSchema.parse(body)

  try {
    // Check if dashboard exists and belongs to user
    const dashboard = await Dashboard.findOne({
      _id: dashboardIdObj,
      projectId: project._id,
      userId: session.user._id
    })

    if (!dashboard) {
      throw createError({ statusCode: 404, message: 'Dashboard not found' })
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await Dashboard.updateMany(
        { projectId: project._id, userId: session.user._id, _id: { $ne: dashboardIdObj } },
        { $set: { isDefault: false } }
      )
    }

    // Update dashboard
    const updatedDashboard = await Dashboard.findByIdAndUpdate(
      dashboardIdObj,
      { $set: data },
      { new: true }
    ).lean()

    return {
      success: true,
      data: updatedDashboard
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid dashboard data' })
    }
    console.error('Error updating dashboard:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
