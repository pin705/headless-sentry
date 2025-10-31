// Định nghĩa các tính năng của từng gói
// Cấu trúc này được thiết kế để dễ dàng render ra UI

export interface PlanFeature {
  text: string
  available: boolean
}

export interface PlanDetails {
  name: string
  description: string
  price: string
  priceDescription: string
  isCurrentPlan: (userPlan: string) => boolean
  cta: {
    label: string
    disabled: boolean
  }
  features: PlanFeature[]
}

export const PLAN_FEATURES: Record<string, PlanDetails> = {
  free: {
    name: 'Gói Free',
    description: 'Cho các dự án cá nhân và thử nghiệm.',
    price: '0đ',
    priceDescription: 'Miễn phí mãi mãi',
    isCurrentPlan: (userPlan: string) => userPlan === 'free',
    cta: {
      label: 'Gói hiện tại',
      disabled: true
    },
    features: [
      { text: '1 Dự án', available: true },
      { text: '5 Monitors', available: true },
      { text: '1 Thành viên (chủ sở hữu)', available: true },
      { text: 'Tần suất quét 5 phút', available: true },
      { text: 'Lưu dữ liệu 1 ngày', available: true },
      { text: 'Giám sát SSL', available: true },
      { text: 'Trang Status Page', available: true },
      { text: 'Giám sát Heartbeat', available: false },
      { text: 'Tên miền tùy chỉnh (Status Page)', available: false },
      { text: 'Kênh cảnh báo nâng cao (Slack, Webhook)', available: false },
    ]
  },
  pro: {
    name: 'Gói Pro',
    description: 'Cho các đội nhóm và dự án chuyên nghiệp.',
    price: '200.000đ',
    priceDescription: '/ tháng',
    isCurrentPlan: (userPlan: string) => userPlan === 'pro',
    cta: {
      label: 'Nâng cấp lên Pro',
      disabled: false
    },
    features: [
      { text: '10 Dự án', available: true },
      { text: '50 Monitors', available: true },
      { text: '10 Thành viên', available: true },
      { text: 'Tần suất quét 1 phút', available: true },
      { text: 'Lưu dữ liệu 30 ngày', available: true },
      { text: 'Giám sát SSL', available: true },
      { text: 'Trang Status Page', available: true },
      { text: 'Giám sát Heartbeat', available: true },
      { text: 'Tên miền tùy chỉnh (Status Page)', available: true },
      { text: 'Kênh cảnh báo nâng cao (Slack, Webhook)', available: true },
    ]
  }
}

// Định nghĩa giới hạn cho từng gói
export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxMonitors: 5,
    maxMembers: 1,
    checkInterval: 5, // minutes
    dataRetention: 1, // days
    hasSSLMonitoring: true,
    hasStatusPage: true,
    hasHeartbeat: false,
    hasCustomDomain: false,
    hasAdvancedAlerts: false,
  },
  pro: {
    maxProjects: 10,
    maxMonitors: 50,
    maxMembers: 10,
    checkInterval: 1, // minutes
    dataRetention: 30, // days
    hasSSLMonitoring: true,
    hasStatusPage: true,
    hasHeartbeat: true,
    hasCustomDomain: true,
    hasAdvancedAlerts: true,
  }
}

export type PlanType = 'free' | 'pro'

// Utility functions
export function getPlanLimits(planType: PlanType = 'free') {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

export function getPlanFeatures(planType: PlanType = 'free') {
  return PLAN_FEATURES[planType] || PLAN_FEATURES.free
}
