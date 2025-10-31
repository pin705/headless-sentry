import { z } from 'zod'
import { validateObjectId } from '~~/server/utils/validation'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  range: z.string().default('24h'),
  status: z.enum(['UP', 'DOWN']).optional(),
  statusCode: z.string().optional(),
  startDate: z.string().datetime().optional(), // ISO string
  endDate: z.string().datetime().optional() // ISO string
})

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)

  const monitorId = getRouterParam(event, 'monitorId')
  const monitorIdObj = validateObjectId(monitorId, 'Monitor ID')

  // (Mới) Parse và validate query
  const queryResult = await getQuery(event)
  const query = querySchema.parse(queryResult)

  const skip = (query.page - 1) * query.limit

  // --- Xây dựng Query cho MongoDB ---
  const matchQuery: any = { 'meta.monitorId': monitorIdObj }

  // 1. Lọc theo thời gian (Nâng cấp)
  if (query.range === 'custom' && query.startDate && query.endDate) {
    // (Mới) Lọc theo ngày tùy chỉnh
    matchQuery.timestamp = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate)
    }
  } else if (query.range !== 'all') {
    // Lọc theo khoảng thời gian (range)
    const now = new Date()
    let gteDate: Date
    switch (query.range) {
      case '1h': gteDate = new Date(now.getTime() - 60 * 60 * 1000); break
      case '6h': gteDate = new Date(now.getTime() - 6 * 60 * 60 * 1000); break
      case '7d': gteDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
      case '30d': gteDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
      case '24h':
      default: gteDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break
    }
    matchQuery.timestamp = { $gte: gteDate }
  }
  // Nếu range == 'all', không lọc thời gian

  // 2. Lọc theo Trạng thái (UP/DOWN)
  const tableMatchQuery = { ...matchQuery } // Copy query thời gian
  if (query.status === 'UP') {
    tableMatchQuery.isUp = true
  } else if (query.status === 'DOWN') {
    tableMatchQuery.isUp = false
  }

  // 3. Lọc theo Mã HTTP
  if (query.statusCode) {
    // (Logic giữ nguyên)
    if (query.statusCode === '2xx') tableMatchQuery.statusCode = { $gte: 200, $lt: 300 }
    else if (query.statusCode === '3xx') tableMatchQuery.statusCode = { $gte: 300, $lt: 400 }
    else if (query.statusCode === '4xx') tableMatchQuery.statusCode = { $gte: 400, $lt: 500 }
    else if (query.statusCode === '5xx') tableMatchQuery.statusCode = { $gte: 500 }
  }

  try {
    // 1. Lấy dữ liệu phân trang cho bảng (UTable)
    const resultsPromise = Result.find(tableMatchQuery)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean()

    // 2. Lấy tổng số lượng (cho UPagination)
    const totalPromise = Result.countDocuments(tableMatchQuery)

    // 3. Lấy dữ liệu cho biểu đồ (Chỉ lọc theo THỜI GIAN, không lọc status/code)
    const chartDataPromise = Result.find(matchQuery) // Dùng query gốc (chỉ có time)
      .sort({ timestamp: 1 }) // Sắp xếp cũ -> mới
      .select('isUp statusCode latency timestamp errorMessage')
      .lean()

    const [results, total, chartData] = await Promise.all([
      resultsPromise,
      totalPromise,
      chartDataPromise
    ])

    return {
      results,
      total,
      chartData
    }
  } catch (error: any) {
    if (error.errors) { // Lỗi validation Zod
      throw createError({ statusCode: 400, message: 'Query không hợp lệ' })
    }
    console.error('Lỗi lấy kết quả monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
