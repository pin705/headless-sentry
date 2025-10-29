// server/cron/monitorCheck.cron.ts
import { defineCronHandler } from '#nuxt/cron'
import { ofetch } from 'ofetch' // <-- IMPORTED
import mongoose from 'mongoose' // <-- IMPORTED

// (MỚI) Thời gian cooldown giữa các cảnh báo (tính bằng mili giây)
const ALERT_COOLDOWN = 5 * 60 * 1000 // 5 phút // <-- DEFINED

export default defineCronHandler(
  () => '*/1 * * * *', // Chạy mỗi phút
  async () => {
    console.log('[Cron] Bắt đầu kiểm tra giám sát API...')

    // (FIXED) Lấy thêm alertConfig, lastAlertedAt, name
    const monitorsToRun = await Monitor.find({ status: 'ACTIVE' })
      .select('endpoint method httpConfig userId projectId alertConfig name lastAlertedAt')
      .lean()

    if (monitorsToRun.length === 0) {
      console.log('[Cron] Không có monitor nào để kiểm tra.')
      return
    }

    const alertsToSend: Array<{ monitor: any, type: string, details: string }> = []
    const monitorsToUpdateLastAlerted: string[] = []

    const checkPromises = monitorsToRun.map((monitor) => {
      const startTime = Date.now()
      const fetchOptions: any = { /* ... logic xây dựng options ... */ }

      // (Logic xây dựng fetchOptions từ httpConfig giữ nguyên)
      if (monitor.httpConfig?.headers?.length > 0) {
        fetchOptions.headers = Object.fromEntries(monitor.httpConfig.headers.map(h => [h.key, h.value]))
      }
      if (monitor.httpConfig?.body && monitor.httpConfig?.bodyType !== 'none') {
        fetchOptions.body = monitor.httpConfig.body
        if (monitor.httpConfig.bodyType === 'json' && !Object.keys(fetchOptions.headers).some(k => k.toLowerCase() === 'content-type')) {
          fetchOptions.headers['Content-Type'] = 'application/json'
        }
      }

      return $fetch.raw(monitor.endpoint, fetchOptions)
        .then((response) => {
          let errorMessage: string | null = null
          let responseBodyString: string | null = null // Khai báo ở đây
          const isUp = response.ok
          const latency = Date.now() - startTime
          const statusCode = response.status

          // (FIXED) Luôn cố gắng đọc body
          try {
            responseBodyString = typeof response._data === 'object' ? JSON.stringify(response._data) : String(response._data)
          } catch { /* Bỏ qua nếu không đọc được body */ }

          // Gán errorMessage nếu !isUp
          if (!isUp) {
            errorMessage = responseBodyString || response.statusText || 'Lỗi HTTP không xác định'
          }

          // === KIỂM TRA ĐIỀU KIỆN CẢNH BÁO ===
          const alertConfig = monitor.alertConfig
          const now = Date.now()
          // (FIXED) Đảm bảo monitor.lastAlertedAt tồn tại trước khi gọi getTime()
          const lastAlertTime = monitor.lastAlertedAt ? new Date(monitor.lastAlertedAt).getTime() : 0
          const canAlert = !lastAlertTime || (now - lastAlertTime > ALERT_COOLDOWN)

          if (alertConfig && canAlert) {
            if (!isUp) { // Downtime (HTTP)
              alertsToSend.push({ monitor, type: 'Downtime', details: `Dịch vụ không hoạt động (Status ${statusCode}). Lỗi: ${errorMessage?.substring(0, 100) || 'N/A'}` })
            } else if (alertConfig.latencyThreshold && latency > alertConfig.latencyThreshold) { // Latency
              alertsToSend.push({ monitor, type: 'Latency Cao', details: `Độ trễ ${latency}ms vượt ngưỡng ${alertConfig.latencyThreshold}ms.` })
            } else if (alertConfig.responseBodyCheck && responseBodyString && responseBodyString.includes(alertConfig.responseBodyCheck)) { // Body Content (FIXED)
              alertsToSend.push({ monitor, type: 'Nội dung Body', details: `Phản hồi chứa nội dung không mong muốn: "...${alertConfig.responseBodyCheck}..."` })
            }
          }
          // ==========================================

          return {
            status: 'fulfilled', // Quan trọng: Đây là kết quả của Promise
            value: { monitor, latency, statusCode, isUp, errorMessage: errorMessage ? errorMessage.substring(0, 500) : null }
          }
        })
        .catch((error) => {
          const latency = Date.now() - startTime
          const errorMessage = error.message.substring(0, 500)
          const statusCode = error.response?.status || 599

          // === KIỂM TRA CẢNH BÁO DOWNTIME (Do Lỗi Network) ===
          const alertConfig = monitor.alertConfig
          const now = Date.now()
          // (FIXED) Đảm bảo monitor.lastAlertedAt tồn tại trước khi gọi getTime()
          const lastAlertTime = monitor.lastAlertedAt ? new Date(monitor.lastAlertedAt).getTime() : 0
          const canAlert = !lastAlertTime || (now - lastAlertTime > ALERT_COOLDOWN)

          if (alertConfig && canAlert) {
            alertsToSend.push({ monitor, type: 'Downtime', details: `Không thể kết nối dịch vụ (Lỗi Network). ${errorMessage}` })
          }
          // =========================================================

          console.error(`Lỗi network khi fetch ${monitor.endpoint}:`, error.message)
          // Trả về cấu trúc tương tự .then nhưng status khác
          return {
            status: 'rejected', // Quan trọng: Đây là kết quả của Promise
            value: { monitor, latency, statusCode, isUp: false, errorMessage } // Đảm bảo có đủ trường
          }
        })
    })

    // --- Chạy kiểm tra và Ghi Kết quả ---
    const results = await Promise.allSettled(checkPromises)
    const resultsToInsert: any[] = []
    const timestamp = new Date()

    results.forEach((result) => {
      // (FIXED) Xử lý cả fulfilled và rejected cases từ allSettled
      let checkResultData: any
      if (result.status === 'fulfilled') {
        // Promise $fetch thành công hoặc trả về lỗi HTTP đã bắt (status: 'fulfilled' / 'rejected' bên trong)
        checkResultData = result.value.value
      } else {
        // Promise $fetch bị reject (lỗi network nghiêm trọng hơn)
        // `reason` thường chứa lỗi, nhưng cấu trúc của chúng ta đã gói nó trong `value`
        if (result.reason && result.reason.value) {
          checkResultData = result.reason.value
        } else {
          console.error('[Cron] Lỗi không xác định khi xử lý kết quả:', result.reason)
          return // Bỏ qua kết quả lỗi này
        }
      }

      if (checkResultData) {
        const { monitor, latency, statusCode, isUp, errorMessage } = checkResultData
        resultsToInsert.push({
          timestamp: timestamp,
          meta: { monitorId: monitor._id, userId: monitor.userId, projectId: monitor.projectId, location: 'default' },
          latency: latency, statusCode: statusCode, isUp: isUp, errorMessage: errorMessage
        })

        // Đánh dấu monitor cần update lastAlertedAt
        if (alertsToSend.some(alert => alert.monitor._id.equals(monitor._id))) {
          if (!monitorsToUpdateLastAlerted.includes(monitor._id.toString())) {
            monitorsToUpdateLastAlerted.push(monitor._id.toString())
          }
        }
      }
    })

    // Ghi kết quả vào DB (Giữ nguyên)
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
      console.log(`[Cron] Đang gửi ${alertsToSend.length} cảnh báo...`)
      const alertPromises = alertsToSend.map(async (alert) => {
        const { monitor, type, details } = alert
        const channels = monitor.alertConfig?.channels || []

        for (const channel of channels) {
          try {
            const payload = {
              text: `🚨 Cảnh báo Headless Sentry: [${monitor.name}] ${type}\nChi tiết: ${details}\nURL: ${monitor.endpoint}`
            }
            await ofetch(channel.url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, retry: 0 })
            console.log(`[Cron] Đã gửi cảnh báo "${type}" cho "${monitor.name}" tới ${new URL(channel.url).hostname}`)
          } catch (webhookError: any) {
            console.error(`[Cron] Lỗi gửi webhook tới ${channel.url} cho "${monitor.name}":`, webhookError.message)
          }
        }
      })
      await Promise.allSettled(alertPromises)

      // --- Cập nhật lastAlertedAt ---
      if (monitorsToUpdateLastAlerted.length > 0) {
        try {
          await Monitor.updateMany(
            // (FIXED) Đảm bảo import mongoose
            { _id: { $in: monitorsToUpdateLastAlerted.map(id => new mongoose.Types.ObjectId(id)) } },
            { $set: { 'alertConfig.lastAlertedAt': new Date() } }
          )
          console.log(`[Cron] Đã cập nhật lastAlertedAt cho ${monitorsToUpdateLastAlerted.length} monitors.`)
        } catch (updateError) {
          console.error('[Cron] Lỗi cập nhật lastAlertedAt:', updateError)
        }
      }
    }
  }
)
