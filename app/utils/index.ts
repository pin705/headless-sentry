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

const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

export function createSslIcon(row: any) {
  // (Tuân thủ Rule 3)
  const ssl = row.original.ssl

  // 1. Kiểm tra không có dữ liệu (hoặc chưa chạy)
  if (!ssl || ssl.daysRemaining === null) {
    // Hiển thị icon trung tính (neutral)
    const icon = h(UIcon, {
      name: 'i-heroicons-shield-exclamation', // Icon khi chưa rõ
      // (Tuân thủ Rule 7)
      class: 'text-neutral-400 dark:text-neutral-500'
    })
    return h(UTooltip, {
      text: 'Chưa kiểm tra SSL (thường chạy 1 lần/ngày)'
    }, () => icon)
  }

  let iconName: string
  let colorClass: string // (Tuân thủ Rule 7)
  let tooltipText: string

  // 2. Xử lý Lỗi (Hết hạn hoặc Invalid)
  if (!ssl.isValid || ssl.daysRemaining < 0) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-error-500' // (Rule 7)
    tooltipText = ssl.errorMessage
      ? `Lỗi: ${ssl.errorMessage}`
      : `SSL đã hết hạn ${Math.abs(ssl.daysRemaining)} ngày trước!`
  }
  // 3. Xử lý Cảnh báo (Sắp hết hạn, < 14 ngày)
  else if (ssl.daysRemaining < 14) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-warning-500' // (Rule 7)
    tooltipText = `SSL sẽ hết hạn sau ${ssl.daysRemaining} ngày (vào ${new Date(ssl.expiresAt).toLocaleDateString('vi-VN')}).`
  }
  // 4. (MỚI) Xử lý Tốt (Healthy) - Đây là phần bị thiếu
  else {
    iconName = 'i-heroicons-shield-check-solid'
    colorClass = 'text-success-500' // (Rule 7)
    tooltipText = `SSL hợp lệ. Còn ${ssl.daysRemaining} ngày (hết hạn ${new Date(ssl.expiresAt).toLocaleDateString('vi-VN')}).`
  }

  // 5. Tạo vnode (luôn trả về 1 icon)
  const icon = h(UIcon, { name: iconName, class: colorClass })
  return h(UTooltip, {
    text: tooltipText,
    popper: { placement: 'top', arrow: true }
  }, () => icon)
}
