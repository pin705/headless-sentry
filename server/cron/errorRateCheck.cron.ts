// server/cron/errorRateCheck.cron.ts
import { defineCronHandler } from '#nuxt/cron'
import { ofetch } from 'ofetch'
import mongoose from 'mongoose'
import { subMinutes } from 'date-fns' // Cần hàm này

// Sử dụng lại ALERT_COOLDOWN từ monitorCheck (hoặc định nghĩa lại ở đây)
const ALERT_COOLDOWN = 5 * 60 * 1000 // 5 phút

// Khoảng thời gian để tính tỷ lệ lỗi (ví dụ: 10 phút)
const ERROR_RATE_WINDOW_MINUTES = 10

export default defineCronHandler(
  // Chạy mỗi 5 phút (ví dụ)
  () => '*/5 * * * *',
  async () => {
    console.log('[Cron ErrorRate] Bắt đầu kiểm tra tỷ lệ lỗi...')

    // 1. Tìm tất cả monitors CÓ cấu hình errorRateThreshold
    const monitorsToCheck = await Monitor.find({
      'status': 'ACTIVE', // Chỉ check monitor đang hoạt động
      'alertConfig.errorRateThreshold': { $exists: true, $ne: null }
    })
      .select('_id name endpoint alertConfig lastAlertedAt') // Lấy các trường cần thiết
      .lean()

    if (monitorsToCheck.length === 0) {
      console.log('[Cron ErrorRate] Không có monitor nào cấu hình cảnh báo tỷ lệ lỗi.')
      return
    }

    const alertsToSend: Array<{ monitor: any, details: string }> = []
    const monitorsToUpdateLastAlerted: string[] = []
    const now = new Date() // Thời gian hiện tại

    // 2. Lặp qua từng monitor để kiểm tra
    for (const monitor of monitorsToCheck) {
      const threshold = monitor.alertConfig.errorRateThreshold
      if (threshold === null || threshold === undefined) continue // Bỏ qua nếu không có ngưỡng

      // Kiểm tra cooldown
      const lastAlertTime = monitor.alertConfig.lastAlertedAt ? new Date(monitor.alertConfig.lastAlertedAt).getTime() : 0
      const canAlert = !lastAlertTime || (now.getTime() - lastAlertTime > ALERT_COOLDOWN)

      if (!canAlert) {
        // console.log(`[Cron ErrorRate] Bỏ qua ${monitor.name} do đang trong cooldown.`);
        continue // Bỏ qua monitor này nếu đang cooldown
      }

      // Tính thời điểm bắt đầu cửa sổ thời gian (vd: 10 phút trước)
      const windowStartTime = subMinutes(now, ERROR_RATE_WINDOW_MINUTES)

      // 3. Truy vấn CSDL để lấy kết quả trong khoảng thời gian
      try {
        const resultsInWindow = await Result.aggregate([
          {
            $match: {
              'meta.monitorId': monitor._id,
              'timestamp': { $gte: windowStartTime }
            }
          },
          {
            $group: {
              _id: null,
              totalChecks: { $sum: 1 },
              totalDown: { $sum: { $cond: ['$isUp', 0, 1] } } // Đếm số lần isUp = false
            }
          }
        ])

        if (resultsInWindow.length === 0 || resultsInWindow[0].totalChecks === 0) {
          // console.log(`[Cron ErrorRate] Không có dữ liệu cho ${monitor.name} trong ${ERROR_RATE_WINDOW_MINUTES} phút qua.`);
          continue // Không có dữ liệu để tính
        }

        const stats = resultsInWindow[0]
        const errorRate = (stats.totalDown / stats.totalChecks) * 100

        // 4. So sánh tỷ lệ lỗi với ngưỡng
        if (errorRate > threshold) {
          // (MỚI) Thêm vào danh sách cảnh báo
          const details = `Tỷ lệ lỗi là ${errorRate.toFixed(1)}% (vượt ngưỡng ${threshold}%) trong ${ERROR_RATE_WINDOW_MINUTES} phút qua (${stats.totalDown}/${stats.totalChecks} lần lỗi).`
          alertsToSend.push({ monitor, details })

          // Đánh dấu monitor này cần cập nhật lastAlertedAt
          if (!monitorsToUpdateLastAlerted.includes(monitor._id.toString())) {
            monitorsToUpdateLastAlerted.push(monitor._id.toString())
          }
        }
        // else {
        //   console.log(`[Cron ErrorRate] Tỷ lệ lỗi của ${monitor.name} là ${errorRate.toFixed(1)}% (dưới ngưỡng ${threshold}%).`);
        // }
      } catch (dbError) {
        console.error(`[Cron ErrorRate] Lỗi khi truy vấn DB cho ${monitor.name}:`, dbError)
      }
    } // Hết vòng lặp for

    // --- GỬI CÁC CẢNH BÁO TỶ LỆ LỖI ---
    if (alertsToSend.length > 0) {
      console.log(`[Cron ErrorRate] Đang gửi ${alertsToSend.length} cảnh báo tỷ lệ lỗi...`)
      const alertPromises = alertsToSend.map(async (alert) => {
        const { monitor, details } = alert
        const channels = monitor.alertConfig?.channels || []
        const type = 'Tỷ lệ lỗi cao' // Loại cảnh báo cố định

        for (const channel of channels) {
          try {
            const payload = {
              text: `🚨 Cảnh báo Headless Sentry: [${monitor.name}] ${type}\nChi tiết: ${details}\nURL: ${monitor.endpoint}`
            }
            await ofetch(channel.url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, retry: 0 })
            console.log(`[Cron ErrorRate] Đã gửi cảnh báo "${type}" cho "${monitor.name}" tới ${new URL(channel.url).hostname}`)
          } catch (webhookError: any) {
            console.error(`[Cron ErrorRate] Lỗi gửi webhook tới ${channel.url} cho "${monitor.name}":`, webhookError.message)
          }
        }
      })
      await Promise.allSettled(alertPromises)

      // --- Cập nhật lastAlertedAt ---
      if (monitorsToUpdateLastAlerted.length > 0) {
        try {
          await Monitor.updateMany(
            { _id: { $in: monitorsToUpdateLastAlerted.map(id => new mongoose.Types.ObjectId(id)) } },
            { $set: { 'alertConfig.lastAlertedAt': new Date() } } // Cập nhật cùng trường lastAlertedAt
          )
          console.log(`[Cron ErrorRate] Đã cập nhật lastAlertedAt cho ${monitorsToUpdateLastAlerted.length} monitors.`)
        } catch (updateError) {
          console.error('[Cron ErrorRate] Lỗi cập nhật lastAlertedAt:', updateError)
        }
      }
    } else {
      console.log('[Cron ErrorRate] Không có cảnh báo tỷ lệ lỗi nào cần gửi.')
    }
  }
)
