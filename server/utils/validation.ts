import mongoose from 'mongoose'
import type { H3Event } from 'h3'

/**
 * Validate and convert ObjectId
 */
export function validateObjectId(id: string | undefined | null, fieldName: string = 'ID'): mongoose.Types.ObjectId {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: `${fieldName} không hợp lệ` })
  }
  return new mongoose.Types.ObjectId(id)
}

/**
 * Get and validate user session
 */
export async function requireUserSession(event: H3Event) {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }
  return {
    session,
    userId: new mongoose.Types.ObjectId(session.user.userId)
  }
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: unknown): never {
  // Check if this is a Zod validation error
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ message: string }> }
    if (zodError.issues && zodError.issues.length > 0) {
      throw createError({ statusCode: 400, message: zodError.issues[0].message })
    }
  }
  throw error
}
