export const formatTimeAgo = (dateString: string | Date, t?: (key: string, params?: Record<string, unknown>) => string): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) {
    return t ? t('time.yearsAgo', { count: interval }) : `${interval} năm trước`
  }

  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) {
    return t ? t('time.monthsAgo', { count: interval }) : `${interval} tháng trước`
  }

  interval = Math.floor(seconds / 86400)
  if (interval >= 1) {
    return t ? t('time.daysAgo', { count: interval }) : `${interval} ngày trước`
  }

  interval = Math.floor(seconds / 3600)
  if (interval >= 1) {
    return t ? t('time.hoursAgo', { count: interval }) : `${interval} giờ trước`
  }

  interval = Math.floor(seconds / 60)
  if (interval >= 1) {
    return t ? t('time.minutesAgo', { count: interval }) : `${interval} phút trước`
  }

  return t ? t('time.justNow') : 'Vừa xong'
}

export function getStatusAppearance(row: any): { color: string, label: string } {
  if (row.status === 'PAUSED') {
    return { color: 'warning', label: 'Tạm dừng' }
  }
  if (row.latestStatus === 'UP') {
    return { color: 'success', label: 'Hoạt động' }
  }
  if (row.latestStatus === 'DOWN') {
    return { color: 'error', label: 'Ngưng' }
  }
  return { color: 'neutral', label: 'N/A' }
}
