import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  description: z.string().nullable().default(null),
  type: z.enum(['one-time', 'recurring']),
  startTime: z.string().datetime().nullable().default(null),
  endTime: z.string().datetime().nullable().default(null),
  cronSchedule: z.string().nullable().default(null),
  duration: z.number().min(1).nullable().default(null),
  isActive: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const project = await requireProjectMembership(event)
  const projectIdObj = project._id

  const body = await readValidatedBody(event, createSchema.parse)

  // Validation cho one-time
  if (body.type === 'one-time') {
    if (!body.startTime || !body.endTime) {
      throw createError({ statusCode: 400, message: 'One-time maintenance window cần startTime và endTime' })
    }
  }

  // Validation cho recurring
  if (body.type === 'recurring') {
    if (!body.cronSchedule || !body.duration) {
      throw createError({ statusCode: 400, message: 'Recurring maintenance window cần cronSchedule và duration' })
    }
  }

  try {
    const window = await MaintenanceWindow.create({
      projectId: projectIdObj,
      name: body.name,
      description: body.description,
      type: body.type,
      startTime: body.startTime ? new Date(body.startTime) : null,
      endTime: body.endTime ? new Date(body.endTime) : null,
      cronSchedule: body.cronSchedule,
      duration: body.duration,
      isActive: body.isActive,
      createdBy: session.user.id
    })

    return window
  } catch (error) {
    console.error('Lỗi tạo maintenance window:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
