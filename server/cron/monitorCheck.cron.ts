// server/cron/monitorCheck.cron.ts
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

    // 1. Tạo mảng các promise kiểm tra
    const checkPromises = monitorsToRun.map((monitor) => {
      const startTime = Date.now()

      // (MỚI) Xây dựng options cho $fetch
      const fetchOptions: any = {
        method: monitor.method as any,
        timeout: 15000,
        ignoreResponseError: true,
        headers: {}
      }

      // 1. (MỚI) Xử lý Headers
      if (monitor.httpConfig?.headers?.length > 0) {
        // Chuyển mảng [{key, value}] thành object {key: value}
        fetchOptions.headers = Object.fromEntries(
          monitor.httpConfig.headers.map(h => [h.key, h.value])
        )
      }

      // 2. (MỚI) Xử lý Body
      if (monitor.httpConfig?.body && monitor.httpConfig?.bodyType !== 'none') {
        fetchOptions.body = monitor.httpConfig.body

        // Tự động thêm Content-Type nếu là JSON và chưa được set
        if (
          monitor.httpConfig.bodyType === 'json'
          && !Object.keys(fetchOptions.headers).some(k => k.toLowerCase() === 'content-type')
        ) {
          fetchOptions.headers['Content-Type'] = 'application/json'
        }
      }

      // Bắt đầu gọi $fetch
      return $fetch.raw(monitor.endpoint, fetchOptions)
        .then((response) => {
        // (Logic bắt lỗi response body giữ nguyên)
          let errorMessage: string | null = null
          if (!response.ok) {
            try {
              errorMessage = typeof response._data === 'object'
                ? JSON.stringify(response._data)
                : String(response._data)
            } catch { errorMessage = 'Không thể đọc nội dung lỗi' }
          }

          return {
            status: 'fulfilled',
            value: { monitor, latency: Date.now() - startTime, statusCode: response.status, isUp: response.ok, errorMessage: errorMessage ? errorMessage.substring(0, 500) : null }
          }
        })
        .catch((error) => {
        // (Logic bắt lỗi network giữ nguyên)
          console.error(`Lỗi network khi fetch ${monitor.endpoint}:`, error.message)
          return {
            status: 'rejected',
            value: { monitor, latency: Date.now() - startTime, statusCode: error.response?.status || 599, isUp: false, errorMessage: error.message.substring(0, 500) }
          }
        })
    })

    // 2. Chạy tất cả promise song song
    const results = await Promise.allSettled(checkPromises)
    const resultsToInsert: any[] = []
    const timestamp = new Date() // Dùng chung 1 timestamp

    results.forEach((result) => {
      let resultValue: any

      if (result.status === 'fulfilled') {
        resultValue = result.value.value
      } else {
        // Vẫn ghi lại kết quả dù promise bị 'rejected' (lỗi network)
        resultValue = result.value
      }

      if (resultValue) {
        // (MỚI) Lấy `errorMessage` ra
        const { monitor, latency, statusCode, isUp, errorMessage } = resultValue
        resultsToInsert.push({
          timestamp: timestamp,
          meta: {
            monitorId: monitor._id,
            userId: monitor.userId,
            location: 'default'
          },
          latency: latency,
          statusCode: statusCode,
          isUp: isUp,
          errorMessage: errorMessage // (MỚI) Thêm vào mảng
        })
      }
    })

    // 3. Ghi tất cả kết quả vào DB
    if (resultsToInsert.length > 0) {
      try {
        await Result.insertMany(resultsToInsert, { ordered: false })
      } catch (dbError) {
        console.error(`[Cron] Lỗi nghiêm trọng khi insertMany vào DB:`, dbError)
      }
    }

    console.log(`[Cron] Hoàn thành kiểm tra ${monitorsToRun.length} monitors. Đã ghi ${resultsToInsert.length} kết quả.`)
  }
)
