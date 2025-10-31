/**
 * Shared utilities for monitor type handling
 */

export interface MonitorType {
  value: string
  label: string
  icon: string
  color: string
  badgeColor: string
  description: string
}

export const MONITOR_TYPES: Record<string, MonitorType> = {
  http: {
    value: 'http',
    label: 'HTTP',
    icon: 'i-lucide-globe',
    color: 'text-blue-500',
    badgeColor: 'blue',
    description: 'Kiểm tra endpoint API/Web qua HTTP/HTTPS'
  },
  keyword: {
    value: 'keyword',
    label: 'Keyword',
    icon: 'i-lucide-search',
    color: 'text-purple-500',
    badgeColor: 'purple',
    description: 'Kiểm tra xem trang web có chứa từ khóa cụ thể'
  },
  ping: {
    value: 'ping',
    label: 'Ping',
    icon: 'i-lucide-radar',
    color: 'text-green-500',
    badgeColor: 'green',
    description: 'Kiểm tra kết nối mạng đến server (ICMP)'
  },
  heartbeat: {
    value: 'heartbeat',
    label: 'Heartbeat',
    icon: 'i-lucide-heart-pulse',
    color: 'text-red-500',
    badgeColor: 'red',
    description: 'Nhận tín hiệu từ cronjob/service của bạn'
  }
}

export function getMonitorTypeLabel(type: string): string {
  return MONITOR_TYPES[type]?.label || type
}

export function getMonitorTypeIcon(type: string): string {
  return MONITOR_TYPES[type]?.icon || 'i-lucide-activity'
}

export function getMonitorTypeColor(type: string): string {
  return MONITOR_TYPES[type]?.color || 'text-gray-500'
}

export function getMonitorTypeBadgeColor(type: string): string {
  return MONITOR_TYPES[type]?.badgeColor || 'neutral'
}

export function getMonitorTypeDescription(type: string): string {
  return MONITOR_TYPES[type]?.description || ''
}

export function getAllMonitorTypes(): MonitorType[] {
  return Object.values(MONITOR_TYPES)
}
