export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) return `${interval} năm trước`

  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) return `${interval} tháng trước`
  interval = Math.floor(seconds / 86400)
  if (interval >= 1) return `${interval} ngày trước`
  interval = Math.floor(seconds / 3600)
  if (interval >= 1) return `${interval} giờ trước`
  interval = Math.floor(seconds / 60)
  if (interval >= 1) return `${interval} phút trước`

  return 'Vừa xong'
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
