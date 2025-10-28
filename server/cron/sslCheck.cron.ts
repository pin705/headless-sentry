import { defineCronHandler } from '#nuxt/cron'
import sslChecker from 'ssl-checker'

// (MỚI) Hàm helper để lấy hostname từ URL
const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname
  } catch (error) {
    console.error(`URL không hợp lệ: ${url}`, error)
    return null
  }
}

export default defineCronHandler(
  // Chạy vào 00:05 (5 phút sau nửa đêm) mỗi ngày
  () => '5 0 * * *',
  async () => {
    console.log('[Cron] Bắt đầu kiểm tra chứng chỉ SSL...')

    // Lấy TẤT CẢ monitors (kể cả PAUSED, vì SSL vẫn cần được theo dõi)
    const monitors = await Monitor.find({}).select('endpoint').lean()
    if (monitors.length === 0) {
      console.log('[Cron SSL] Không có monitor nào để kiểm tra SSL.')
      return
    }

    const checkPromises = monitors.map(async (monitor) => {
      const hostname = getHostname(monitor.endpoint)
      if (!hostname) {
        return // Bỏ qua nếu URL không hợp lệ
      }

      const updateData: any = {
        'ssl.lastCheckedAt': new Date()
      }

      try {
        // (MỚI) Gọi thư viện kiểm tra SSL
        const result = await sslChecker(hostname, { method: 'GET', port: 443 })

        updateData['ssl.isValid'] = result.valid
        updateData['ssl.expiresAt'] = new Date(result.validTo)
        updateData['ssl.daysRemaining'] = result.daysRemaining
        updateData['ssl.errorMessage'] = null
      } catch (error: any) {
        // (MỚI) Xử lý lỗi (ví dụ: self-signed, hết hạn, không kết nối được)
        console.error(`[Cron SSL] Lỗi khi kiểm tra ${hostname}:`, error.message)
        updateData['ssl.isValid'] = false
        updateData['ssl.daysRemaining'] = 0
        updateData['ssl.errorMessage'] = error.message
      }

      // Cập nhật thông tin SSL cho monitor này
      await Monitor.updateOne({ _id: monitor._id }, { $set: updateData })
    })

    // Chạy song song (nhưng có thể giới hạn concurrency nếu cần)
    await Promise.allSettled(checkPromises)

    console.log(`[Cron SSL] Hoàn thành kiểm tra SSL cho ${monitors.length} monitors.`)
  }
)
