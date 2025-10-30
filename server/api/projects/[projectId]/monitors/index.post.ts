import { z } from 'zod'

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

const bodySchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ'),
  method: z.enum(httpMethods).default('GET'),
  frequency: z.number().default(60),

  httpConfig: z.object({
    headers: z.array(z.object({
      key: z.string().min(1, 'Header Key không được trống'),
      value: z.string()
    })).default([]),
    body: z.string().nullable().default(null),
    bodyType: z.enum(['none', 'json', 'raw']).default('none')
  }).default({ headers: [], body: null, bodyType: 'none' }),

  alertConfig: z.object({
    latencyThreshold: z.number().min(0).nullable().default(null),
    responseBodyCheck: z.string().nullable().default(null),
    errorRateThreshold: z.number().min(0).max(100).nullable().default(null),
    channels: z.array(z.object({ url: z.string().url('URL Webhook không hợp lệ') })).default([])
  }).default({ latencyThreshold: null, responseBodyCheck: null, errorRateThreshold: null, channels: [] })
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const body = await readValidatedBody(event, bodySchema.parse)
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
      userId: session.user.userId,
    })

    return newMonitor.toObject()
  } catch (error) {
    if (error.issues) {
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    console.error('Lỗi tạo monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
