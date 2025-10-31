import { getRequireUserSession } from '~~/server/utils/validation'

// Models (Transaction) are auto-imported by nuxt-mongoose

export default defineEventHandler(async (event) => {
  const { userId } = await getRequireUserSession(event)

  try {
    // Get query parameters for pagination
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const skip = (page - 1) * limit

    // Fetch transactions for the user
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ userId })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch transactions'
    })
  }
})
