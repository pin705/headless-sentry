import { ofetch } from 'ofetch'
import mongoose from 'mongoose'

// Thời gian cooldown giữa các cảnh báo (tính bằng mili giây)
export const ALERT_COOLDOWN = 5 * 60 * 1000 // 5 phút

/**
 * Kiểm tra xem monitor có thể gửi cảnh báo hay không (dựa trên cooldown)
 */
export function canSendAlert(lastAlertedAt: Date | null | undefined): boolean {
  if (!lastAlertedAt) return true
  const now = Date.now()
  const lastAlertTime = new Date(lastAlertedAt).getTime()
  return now - lastAlertTime > ALERT_COOLDOWN
}

interface AlertMonitor {
  _id: mongoose.Types.ObjectId
  name: string
  endpoint: string
  alertConfig?: {
    channels?: Array<{ url: string }>
  }
}

interface Alert {
  monitor: AlertMonitor
  type: string
  details: string
}

/**
 * Gửi cảnh báo đến tất cả các channels của monitor
 */
export async function sendAlerts(alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return

  console.log(`[Alert] Đang gửi ${alerts.length} cảnh báo...`)

  const alertPromises = alerts.map(async (alert) => {
    const { monitor, type, details } = alert
    const channels = monitor.alertConfig?.channels || []

    for (const channel of channels) {
      try {
        const payload = {
          text: `🚨 Cảnh báo Headless Sentry: [${monitor.name}] ${type}\nChi tiết: ${details}\nURL: ${monitor.endpoint}`
        }
        await ofetch(channel.url, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          retry: 0
        })
        console.log(`[Alert] Đã gửi cảnh báo "${type}" cho "${monitor.name}" tới ${new URL(channel.url).hostname}`)
      } catch (webhookError: unknown) {
        const error = webhookError as Error
        console.error(`[Alert] Lỗi gửi webhook tới ${channel.url} cho "${monitor.name}":`, error.message)
      }
    }
  })

  await Promise.allSettled(alertPromises)
}

/**
 * Cập nhật lastAlertedAt cho các monitors đã gửi cảnh báo
 */
export async function updateLastAlertedAt(monitorIds: string[]): Promise<void> {
  if (monitorIds.length === 0) return

  try {
    await Monitor.updateMany(
      { _id: { $in: monitorIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { 'alertConfig.lastAlertedAt': new Date() } }
    )
    console.log(`[Alert] Đã cập nhật lastAlertedAt cho ${monitorIds.length} monitors.`)
  } catch (updateError) {
    console.error('[Alert] Lỗi cập nhật lastAlertedAt:', updateError)
  }
}
