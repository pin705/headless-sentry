export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const projectIdObj = project._id

  const projectSlug = (project.statusPage?.isEnabled && project.statusPage.slug)
    ? project.statusPage.slug
    : null

  try {
    const monitorsWithData = await Monitor.aggregate([
      // 1. Lọc monitor của project hiện tại
      { $match: { projectId: projectIdObj } },
      { $sort: { name: 1 } },

      // 2. Lookup kết quả mới nhất (Giữ nguyên)
      { $lookup: {
        from: 'results',
        let: { monitorId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$meta.monitorId', '$$monitorId'] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 }
        ],
        as: 'latestResult'
      } },
      { $unwind: { path: '$latestResult', preserveNullAndEmptyArrays: true } },

      { $lookup: {
        from: 'users', // Tên collection của User model
        localField: 'userId', // Trường trong Monitor model
        foreignField: '_id', // Trường trong User model
        as: 'creator'
      } },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } }, // Bỏ mảng

      { $project: {
        _id: 1, name: 1, endpoint: 1, status: 1, method: 1,
        frequency: 1, createdAt: 1, ssl: 1, isPublic: 1,
        latestStatus: { $cond: { if: '$latestResult.isUp', then: 'UP', else: { $cond: { if: '$latestResult', then: 'DOWN', else: 'N/A' } } } },
        latestLatency: '$latestResult.latency',
        latestCheckedAt: '$latestResult.timestamp',
        creator: {
          email: '$creator.email',
          avatarUrl: '$creator.avatarUrl'
        }
      } }
    ])

    const finalMonitors = monitorsWithData.map(monitor => ({
      ...monitor,
      publicPageUrl: (monitor.isPublic && projectSlug) ? `/status/${projectSlug}` : null
    }))

    return finalMonitors
  } catch (error: any) {
    console.error('Lỗi lấy danh sách monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
