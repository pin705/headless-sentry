import { getRequireUserSession } from '~~/server/utils/validation'
import { getUserUsage } from '~~/server/utils/plan-limits'

export default defineEventHandler(async (event) => {
  const { userId } = await getRequireUserSession(event)

  try {
    const usage = await getUserUsage(userId)
    return usage
  } catch (error: any) {
    console.error('Error getting user usage:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Lỗi khi lấy thông tin sử dụng'
    })
  }
})
