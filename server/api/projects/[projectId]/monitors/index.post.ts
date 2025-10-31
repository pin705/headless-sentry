import { monitorBodySchema } from '~~/server/utils/schemas'
import { requireUserSession, handleValidationError } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { session } = await requireUserSession(event)

  try {
    const body = await readValidatedBody(event, monitorBodySchema.parse)
    const projectId = getRouterParam(event, 'projectId')
    const newMonitor = await Monitor.create({
      projectId,
      name: body.name,
      endpoint: body.endpoint,
      method: body.method,
      frequency: body.frequency,
      status: 'ACTIVE',
      httpConfig: body.httpConfig,
      alertConfig: body.alertConfig,
      userId: session.user?.userId
    })

    return newMonitor.toObject()
  } catch (error) {
    handleValidationError(error)
    console.error('Lỗi tạo monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
