import cronParser from 'cron-parser'
import type { Types } from 'mongoose'

interface MaintenanceWindowDoc {
  _id: Types.ObjectId
  projectId: Types.ObjectId
  type: 'one-time' | 'recurring'
  startTime?: Date | null
  endTime?: Date | null
  cronSchedule?: string | null
  duration?: number | null
  isActive: boolean
}

/**
 * Kiểm tra xem project có đang trong maintenance window không
 */
export async function isInMaintenanceWindow(projectId: Types.ObjectId): Promise<boolean> {
  const now = new Date()

  // Tìm tất cả maintenance windows đang active cho project này
  const windows = await MaintenanceWindow.find({
    projectId,
    isActive: true
  }).lean() as MaintenanceWindowDoc[]

  for (const window of windows) {
    if (window.type === 'one-time') {
      // Kiểm tra one-time maintenance window
      if (window.startTime && window.endTime) {
        const start = new Date(window.startTime)
        const end = new Date(window.endTime)
        if (now >= start && now <= end) {
          return true
        }
      }
    } else if (window.type === 'recurring') {
      // Kiểm tra recurring maintenance window
      if (window.cronSchedule && window.duration) {
        try {
          const interval = cronParser.parseExpression(window.cronSchedule, {
            currentDate: now
          })

          // Lấy lần chạy gần nhất trước now
          const prevRun = interval.prev().toDate()

          // Tính thời điểm kết thúc của maintenance window
          const maintenanceEnd = new Date(prevRun.getTime() + window.duration * 60 * 1000)

          // Kiểm tra xem now có nằm trong khoảng maintenance không
          if (now >= prevRun && now <= maintenanceEnd) {
            return true
          }
        } catch (error) {
          console.error(`[MaintenanceWindow] Lỗi parse cron schedule cho window ${window._id}:`, error)
        }
      }
    }
  }

  return false
}
