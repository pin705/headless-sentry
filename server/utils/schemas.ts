import { z } from 'zod'

// HTTP Methods
export const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

// Monitor Frequencies
export const frequencies = [60, 300, 600, 1800, 3600] as const

// Monitor Validation Schema - shared between POST and PUT
export const monitorBodySchema = z.object({
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

export type MonitorBody = z.infer<typeof monitorBodySchema>
