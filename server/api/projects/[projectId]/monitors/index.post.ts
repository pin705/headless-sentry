import { monitorBodySchema } from '~~/server/utils/schemas'
import { getRequireUserSession, handleValidationError } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { session, userId } = await getRequireUserSession(event)

  try {
    const body = await readValidatedBody(event, monitorBodySchema.parse)
    const projectId = getRouterParam(event, 'projectId')

    // Check plan limits before creating monitor
    const { canCreateMonitor, isFrequencyAllowed } = await import('~~/server/utils/plan-limits')
    const limitCheck = await canCreateMonitor(userId)

    if (!limitCheck.allowed) {
      throw createError({
        statusCode: 403,
        message: limitCheck.reason || 'Không thể tạo monitor mới'
      })
    }

    // Get user's plan to check frequency limits
    const user = await User.findById(userId)
    if (!user) {
      throw createError({ statusCode: 404, message: 'Người dùng không tồn tại' })
    }

    // Validate frequency based on plan
    if (!isFrequencyAllowed(user.plan as any, body.frequency)) {
      const { getPlanLimits } = await import('~~/shared/constants/plans')
      const limits = getPlanLimits(user.plan as any)
      throw createError({
        statusCode: 403,
        message: `Tần suất quét tối thiểu của gói ${user.plan.toUpperCase()} là ${limits.checkInterval} phút. Vui lòng nâng cấp để sử dụng tần suất nhanh hơn.`
      })
    }

    const newMonitor = await Monitor.create({
      projectId,
      name: body.name,
      endpoint: body.endpoint,
      method: body.method,
      frequency: body.frequency,
      status: 'ACTIVE',
      httpConfig: body.httpConfig,
      alertConfig: body.alertConfig,
      userId: session.user.userId
    })

    return newMonitor.toObject()
  } catch (error) {
    handleValidationError(error)
    console.error('Lỗi tạo monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
