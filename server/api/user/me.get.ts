export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const user = await User.findById(session.user.userId).select('-password').lean()

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  return {
    userId: String(user._id),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    plan: user.plan || 'free',
    balance: user.balance || 0,
    planExpiresAt: user.planExpiresAt,
    language: user.language || 'vi'
  }
})
