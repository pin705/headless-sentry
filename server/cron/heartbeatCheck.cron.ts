import { defineCronHandler } from '#nuxt/cron'
import { canSendAlert, sendAlerts, updateLastAlertedAt } from '~~/server/utils/alerts'
import { isInMaintenanceWindow } from '~~/server/utils/maintenanceWindow'

export default defineCronHandler(
  () => '*/1 * * * *', // Chạy mỗi phút
  async () => {
    console.log('[Heartbeat Cron] Bắt đầu kiểm tra heartbeat monitors...')

    // Lấy tất cả heartbeat monitors đang active
    const heartbeatMonitors = await Monitor.find({
      status: 'ACTIVE',
      type: 'heartbeat'
    })
      .select('name projectId expectedInterval gracePeriod lastHeartbeat alertConfig')
      .lean()

    if (heartbeatMonitors.length === 0) {
      console.log('[Heartbeat Cron] Không có heartbeat monitor nào để kiểm tra.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alertsToSend: Array<{ monitor: any, type: string, details: string }> = []
    const monitorsToUpdateLastAlerted: string[] = []
    const now = Date.now()

    for (const monitor of heartbeatMonitors) {
      // Bỏ qua nếu chưa có heartbeat đầu tiên
      if (!monitor.lastHeartbeat || !monitor.expectedInterval) {
        continue
      }

      const lastHeartbeatTime = new Date(monitor.lastHeartbeat).getTime()
      const expectedIntervalMs = monitor.expectedInterval * 1000
      const gracePeriodMs = (monitor.gracePeriod || 300) * 1000
      const maxAllowedTime = lastHeartbeatTime + expectedIntervalMs + gracePeriodMs

      // Kiểm tra xem đã quá thời gian dự kiến chưa
      if (now > maxAllowedTime) {
        const overdueDuration = Math.floor((now - maxAllowedTime) / 1000 / 60) // phút

        // Kiểm tra điều kiện cảnh báo
        if (monitor.alertConfig && canSendAlert(monitor.alertConfig.lastAlertedAt)) {
          alertsToSend.push({
            monitor,
            type: 'Heartbeat Missing',
            details: `Không nhận được heartbeat từ "${monitor.name}" trong ${overdueDuration} phút. Lần cuối: ${new Date(monitor.lastHeartbeat).toLocaleString('vi-VN')}`
          })
          monitorsToUpdateLastAlerted.push(monitor._id.toString())
        }
      }
    }

    console.log(`[Heartbeat Cron] Hoàn thành kiểm tra ${heartbeatMonitors.length} heartbeat monitors.`)

    // Gửi cảnh báo (Kiểm tra Maintenance Window)
    if (alertsToSend.length > 0) {
      const alertsToSendFiltered = []
      for (const alert of alertsToSend) {
        const inMaintenance = await isInMaintenanceWindow(alert.monitor.projectId)
        if (!inMaintenance) {
          alertsToSendFiltered.push(alert)
        } else {
          console.log(`[Heartbeat Cron] Bỏ qua cảnh báo cho monitor "${alert.monitor.name}" vì project đang trong maintenance window.`)
        }
      }

      if (alertsToSendFiltered.length > 0) {
        await sendAlerts(alertsToSendFiltered)
        await updateLastAlertedAt(monitorsToUpdateLastAlerted)
      }
    }
  }
)
