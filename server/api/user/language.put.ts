import { z } from 'zod'
import { getRequireUserSession, handleValidationError } from '~~/server/utils/validation'

const languageSchema = z.object({
  language: z.enum(['vi', 'en'])
})

export default defineEventHandler(async (event) => {
  const { userId } = await getRequireUserSession(event)

  try {
    const body = await readValidatedBody(event, languageSchema.parse)

    // Update user language preference
    const user = await User.findByIdAndUpdate(
      userId,
      { language: body.language },
      { new: true }
    )

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    return {
      success: true,
      message: 'Language preference updated successfully',
      language: user.language
    }
  } catch (error) {
    handleValidationError(error)
    console.error('Error updating language:', error)
    throw error
  }
})
