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

      return $fetch.raw(monitor.endpoint, {
        method: monitor.method as any,
        timeout: 15000, // 15 giây timeout
        ignoreResponseError: true // Rất quan trọng!
      })
        .then((response) => {
        // (MỚI) Logic bắt nội dung lỗi
          let errorMessage: string | null = null
          if (!response.ok) { // Nếu status là 4xx, 5xx
            if (response._data) {
              try {
              // Cố gắng stringify nếu là JSON, nếu không thì convert sang String
                errorMessage = typeof response._data === 'object'
                  ? JSON.stringify(response._data)
                  : String(response._data)
              } catch {
                errorMessage = 'Không thể đọc nội dung lỗi (Response Body)'
              }
            } else {
              errorMessage = response.statusText || 'Lỗi HTTP không xác định'
            }
          }

          return {
            status: 'fulfilled',
            value: {
              monitor,
              latency: Date.now() - startTime,
              statusCode: response.status,
              isUp: response.ok,
              errorMessage: errorMessage ? errorMessage.substring(0, 500) : null // Cắt ngắn lỗi
            }
          }
        })
        .catch((error) => {
        // (MỚI) Logic bắt lỗi network (DNS, Timeout, Connection Refused...)
          console.error(`Lỗi network khi fetch ${monitor.endpoint}:`, error.message)
          return {
            status: 'rejected',
            value: {
              monitor,
              latency: Date.now() - startTime,
              statusCode: error.response?.status || 599, // 599 = Lỗi network/timeout
              isUp: false,
              errorMessage: error.message.substring(0, 500) // Ghi lại tin nhắn lỗi
            }
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
