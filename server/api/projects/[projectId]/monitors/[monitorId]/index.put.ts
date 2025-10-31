import { monitorBodySchema } from '~~/server/utils/schemas'
import { handleValidationError } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)

  const monitorId = getRouterParam(event, 'monitorId')
  const projectId = getRouterParam(event, 'projectId')

  if (!monitorId) {
    throw createError({ statusCode: 400, message: 'Thiếu Monitor ID' })
  }

  try {
    // Validate body
    const body = await readValidatedBody(event, monitorBodySchema.parse)
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
    handleValidationError(error)
    console.error('Lỗi cập nhật monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
