import { defineCronHandler } from '#nuxt/cron'
import { canSendAlert, sendAlerts, updateLastAlertedAt } from '~~/server/utils/alerts'

export default defineCronHandler(
  () => '*/1 * * * *', // Chạy mỗi phút
  async () => {
    console.log('[Cron] Bắt đầu kiểm tra giám sát API...')

    // Lấy monitors đang active và các trường cần thiết
    const monitorsToRun = await Monitor.find({ status: 'ACTIVE' })
      .select('endpoint method httpConfig projectId alertConfig name lastAlertedAt') // Đã bao gồm projectId
      .lean()

    if (monitorsToRun.length === 0) {
      console.log('[Cron] Không có monitor nào để kiểm tra.')
      return
    }

    const alertsToSend: Array<{ monitor: any, type: string, details: string }> = []
    const monitorsToUpdateLastAlerted: string[] = []

    const checkPromises = monitorsToRun.map((monitor) => {
      const startTime = Date.now()

      // --- KHỞI TẠO VÀ ĐIỀN fetchOptions ---
      const fetchOptions: any = {
        method: monitor.method as any,
        timeout: 15000, // 15 giây timeout
        ignoreResponseError: true, // Rất quan trọng!
        headers: {} // Khởi tạo headers trống
      }

      // 1. Xử lý Headers
      if (monitor.httpConfig?.headers?.length > 0) {
        fetchOptions.headers = Object.fromEntries(
          monitor.httpConfig.headers.map(h => [h.key, h.value])
        )
      }

      // 2. Xử lý Body
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
      // --- Hết phần fetchOptions ---

      // Bắt đầu gọi $fetch
      return $fetch.raw(monitor.endpoint, fetchOptions)
        .then((response) => {
          let errorMessage: string | null = null
          let responseBodyString: string | null = null
          const isUp = response.ok
          const latency = Date.now() - startTime
          const statusCode = response.status

          // Luôn cố gắng đọc body
          try {
            responseBodyString = typeof response._data === 'object' ? JSON.stringify(response._data) : String(response._data)
          } catch { /* Bỏ qua nếu không đọc được body */ }

          // Gán errorMessage nếu !isUp
          if (!isUp) {
            errorMessage = responseBodyString || response.statusText || 'Lỗi HTTP không xác định'
          }

          // === KIỂM TRA ĐIỀU KIỆN CẢNH BÁO ===
          const alertConfig = monitor.alertConfig

          if (alertConfig && canSendAlert(monitor.lastAlertedAt)) {
            if (!isUp) { // Downtime (HTTP)
              alertsToSend.push({ monitor, type: 'Downtime', details: `Dịch vụ không hoạt động (Status ${statusCode}). Lỗi: ${errorMessage?.substring(0, 100) || 'N/A'}` })
            } else if (alertConfig.latencyThreshold != null && latency > alertConfig.latencyThreshold) { // Latency (Kiểm tra != null)
              alertsToSend.push({ monitor, type: 'Latency Cao', details: `Độ trễ ${latency}ms vượt ngưỡng ${alertConfig.latencyThreshold}ms.` })
            } else if (alertConfig.responseBodyCheck && responseBodyString && responseBodyString.includes(alertConfig.responseBodyCheck)) { // Body Content
              alertsToSend.push({ monitor, type: 'Nội dung Body', details: `Phản hồi chứa nội dung không mong muốn: "...${alertConfig.responseBodyCheck}..."` })
            }
          }
          // ==========================================

          return {
            status: 'fulfilled', // Kết quả của Promise
            value: { monitor, latency, statusCode, isUp, errorMessage: errorMessage ? errorMessage.substring(0, 500) : null }
          }
        })
        .catch((error) => {
          const latency = Date.now() - startTime
          const errorMessage = error.message.substring(0, 500)
          const statusCode = error.response?.status || 599 // Lỗi network

          // === KIỂM TRA CẢNH BÁO DOWNTIME (Do Lỗi Network) ===
          const alertConfig = monitor.alertConfig

          if (alertConfig && canSendAlert(monitor.lastAlertedAt)) {
            alertsToSend.push({ monitor, type: 'Downtime', details: `Không thể kết nối dịch vụ (Lỗi Network). ${errorMessage}` })
          }
          // =========================================================

          console.error(`Lỗi network khi fetch ${monitor.endpoint}:`, error.message)
          return {
            status: 'rejected', // Kết quả của Promise
            value: { monitor, latency, statusCode, isUp: false, errorMessage } // Đầy đủ các trường
          }
        })
    })

    // --- Chạy kiểm tra và Ghi Kết quả ---
    const results = await Promise.allSettled(checkPromises)
    const resultsToInsert: any[] = []
    const timestamp = new Date()

    results.forEach((result) => {
      let checkResultData: any
      if (result.status === 'fulfilled') {
        checkResultData = result.value.value
      } else { // status === 'rejected'
        // Lấy value từ reason (theo cấu trúc đã return ở catch)
        if (result.reason && result.reason.value) {
          checkResultData = result.reason.value
        } else {
          // Ghi log lỗi không mong muốn từ Promise.allSettled
          console.error('[Cron] Lỗi không xác định khi xử lý kết quả promise:', result.reason)
          return // Bỏ qua kết quả lỗi này
        }
      }

      if (checkResultData) {
        const { monitor, latency, statusCode, isUp, errorMessage } = checkResultData
        // Đảm bảo monitor._id, và monitor.projectId tồn tại
        if (!monitor?._id || !monitor?.projectId) {
          console.error('[Cron] Thiếu ID trong dữ liệu monitor khi ghi kết quả:', monitor)
          return // Bỏ qua bản ghi lỗi này
        }
        resultsToInsert.push({
          timestamp: timestamp,
          meta: {
            monitorId: monitor._id,
            projectId: monitor.projectId, // Project chứa monitor
            location: 'default'
          },
          latency: latency,
          statusCode: statusCode,
          isUp: isUp,
          errorMessage: errorMessage
        })

        // Đánh dấu monitor cần update lastAlertedAt
        if (alertsToSend.some(alert => alert.monitor._id.equals(monitor._id))) {
          if (!monitorsToUpdateLastAlerted.includes(monitor._id.toString())) {
            monitorsToUpdateLastAlerted.push(monitor._id.toString())
          }
        }
      }
    })

    // Ghi kết quả vào DB
    if (resultsToInsert.length > 0) {
      try {
        await Result.insertMany(resultsToInsert, { ordered: false })
      } catch (dbError) {
        console.error(`[Cron] Lỗi insertMany kết quả:`, dbError)
      }
    }
    console.log(`[Cron] Hoàn thành kiểm tra ${monitorsToRun.length} monitors. Đã ghi ${resultsToInsert.length} kết quả.`)

    // --- GỬI CÁC CẢNH BÁO ---
    if (alertsToSend.length > 0) {
      await sendAlerts(alertsToSend)
      await updateLastAlertedAt(monitorsToUpdateLastAlerted)
    }
  }
)
