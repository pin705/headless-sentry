import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  startTime: z.string().datetime().nullable().optional(),
  endTime: z.string().datetime().nullable().optional(),
  cronSchedule: z.string().nullable().optional(),
  duration: z.number().min(1).nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)
  const windowId = getRouterParam(event, 'windowId')

  if (!windowId) {
    throw createError({ statusCode: 400, message: 'windowId không hợp lệ' })
  }

  const body = await readValidatedBody(event, updateSchema.parse)

  try {
    const updatedWindow = await MaintenanceWindow.findByIdAndUpdate(
      windowId,
      { $set: body },
      { new: true }
    )

    if (!updatedWindow) {
      throw createError({ statusCode: 404, message: 'Maintenance window không tồn tại' })
    }

    return updatedWindow
  } catch (error) {
    console.error('Lỗi cập nhật maintenance window:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
