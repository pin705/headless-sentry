import { z } from 'zod'

// Tái sử dụng validation schema từ file POST
const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const frequencies = [60, 300, 600, 1800, 3600] as const

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
  await requireProjectMembership(event)

  const monitorId = getRouterParam(event, 'monitorId')
  const projectId = getRouterParam(event, 'projectId')

  if (!monitorId) {
    throw createError({ statusCode: 400, message: 'Thiếu Monitor ID' })
  }

  try {
    // Validate body
    const body = await readValidatedBody(event, bodySchema.parse)
    console.log('Dữ liệu cập nhật monitor:', body?.name)

    // Tìm và cập nhật monitor
    const updatedMonitor = await Monitor.findOneAndUpdate(
      { _id: monitorId }, // Điều kiện tìm
      { $set: body }, // Dữ liệu cập nhật
      { new: true } // Trả về document đã cập nhật
    )

    if (!updatedMonitor) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy' })
    }

    return updatedMonitor.toObject()
  } catch (error: any) {
    if (error.issues) { // Lỗi Zod
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    console.error('Lỗi cập nhật monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
