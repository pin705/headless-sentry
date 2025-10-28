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

export function getStatusAppearance(status: any): { color: string, label: string } {
  if (status === 'PAUSED') {
    return { color: 'neutral', label: 'Tạm dừng' } // 'neutral' thay cho 'gray'
  }
  if (status === 'ACTIVE') {
    return { color: 'success', label: 'Hoạt động' } // 'success' thay cho 'green'
  }
  if (status === 'DOWN') {
    return { color: 'error', label: 'Ngưng' } // 'error' thay cho 'red'
  }
  return { color: 'neutral', label: 'N/A' }
}
