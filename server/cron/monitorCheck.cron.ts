import { defineCronHandler } from '#nuxt/cron'

export default defineCronHandler(
  () => '*/1 * * * *', // Chạy mỗi phút
  async () => {
    console.log('[Cron] Bắt đầu kiểm tra giám sát API...')

    const monitorsToRun = await Monitor.find({ status: 'ACTIVE' }).lean()
    if (monitorsToRun.length === 0) {
      console.log('[Cron] Không có monitor nào để kiểm tra.')
      return
    }

    // --- VẤN ĐỀ 2: Tối ưu hiệu năng (Song song hóa) ---

    // 1. Tạo mảng các promise kiểm tra
    const checkPromises = monitorsToRun.map((monitor) => {
      const startTime = Date.now()

      return $fetch.raw(monitor.endpoint, {
        method: monitor.method as any,
        timeout: 15000, // 15 giây timeout
        ignoreResponseError: true // Rất quan trọng!
      })
        .then((response) => {
        // Thành công (kể cả lỗi 4xx, 5xx)
          return {
            status: 'fulfilled',
            value: {
              monitor,
              latency: Date.now() - startTime,
              statusCode: response.status,
              isUp: response.ok // status 200-299
            }
          }
        })
        .catch((error) => {
        // Thất bại (lỗi network, DNS, timeout...)
          console.error(`Lỗi network khi fetch ${monitor.endpoint}:`, error.message)
          return {
            status: 'rejected',
            value: {
              monitor,
              latency: Date.now() - startTime,
              statusCode: error.response?.status || 599, // 599 là mã lỗi tùy chỉnh (ví dụ: timeout)
              isUp: false
            }
          }
        })
    })

    // 2. Chạy tất cả promise song song và đợi
    // Dùng allSettled để dù 1 promise lỗi, các promise khác vẫn chạy tiếp
    const results = await Promise.allSettled(checkPromises)

    const resultsToInsert: any[] = []

    results.forEach((result) => {
      // Bỏ qua các lỗi không mong muốn (dù .catch ở trên đã xử lý)
      if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
        const { monitor, latency, statusCode, isUp } = result.value.value
        resultsToInsert.push({
          timestamp: new Date(),
          meta: {
            monitorId: monitor._id,
            userId: monitor.userId,
            location: 'default'
          },
          latency: latency,
          statusCode: statusCode,
          isUp: isUp
        })
      } else if (result.status === 'fulfilled' && result.value.status === 'rejected') {
        // Xử lý các lỗi đã bắt (network, timeout...)
        const { monitor, latency, statusCode, isUp } = result.value.value
        resultsToInsert.push({
          timestamp: new Date(),
          meta: {
            monitorId: monitor._id,
            userId: monitor.userId,
            location: 'default'
          },
          latency: latency,
          statusCode: statusCode,
          isUp: isUp
        })
      }
    })

    // 3. Ghi tất cả kết quả vào DB CHỈ MỘT LẦN
    if (resultsToInsert.length > 0) {
      try {
        await Result.insertMany(resultsToInsert, {
          ordered: false // Không quan tâm thứ tự, ghi nhanh nhất có thể
        })
      } catch (dbError) {
        console.error(`[Cron] Lỗi nghiêm trọng khi insertMany vào DB:`, dbError)
      }
    }

    console.log(`[Cron] Hoàn thành kiểm tra ${monitorsToRun.length} monitors. Đã ghi ${resultsToInsert.length} kết quả.`)
  },
  {
    // Thêm tùy chọn này để ngăn cron chạy chồng chéo
    // Nếu cron job trước chưa xong, job mới sẽ không bắt đầu
    // concurrencyPolicy: 'FORBID'
    // Tùy chọn: lazy: true (nếu dùng nuxt-scheduler)
  }
)
