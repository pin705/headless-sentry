import { computed, type ComputedRef } from 'vue'

export interface StatusPageMonitor {
  _id: string
  name: string
  currentStatus: 'OPERATIONAL' | 'OUTAGE' | 'MAINTENANCE' | 'UNKNOWN'
}

export interface StatusPageConfig {
  title?: string
  logoUrl?: string
  isEnabled: boolean
  slug: string
}

export interface StatusPageData {
  config: StatusPageConfig | null
  monitors: StatusPageMonitor[]
}

export interface StatusInfo {
  text: string
  colorClass: string
  icon: string
}

export interface StatusMapItem {
  label: string
  color: string
  icon: string
}

export const useStatusPage = (slug: string) => {
  const { t } = useI18n()

  // Status mapping with i18n support
  const statusMap = computed<Record<string, StatusMapItem>>(() => ({
    OPERATIONAL: {
      label: t('status.status.operational'),
      color: 'success',
      icon: 'i-heroicons-check-circle-solid'
    },
    OUTAGE: {
      label: t('status.status.outage'),
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle-solid'
    },
    MAINTENANCE: {
      label: t('status.status.maintenance'),
      color: 'warning',
      icon: 'i-heroicons-wrench-solid'
    },
    UNKNOWN: {
      label: t('status.status.unknown'),
      color: 'neutral',
      icon: 'i-heroicons-question-mark-circle-solid'
    }
  }))

  // Fetch status page data
  const { data, pending, error } = useFetch<StatusPageData>(`/api/public/status/${slug}`, {
    lazy: true,
    default: () => ({ config: null, monitors: [] })
  })

  // Calculate overall status
  const overallStatus: ComputedRef<StatusInfo | null> = computed(() => {
    if (!data.value?.monitors || data.value.monitors.length === 0) return null

    const monitors = data.value.monitors
    const hasOutage = monitors.some(m => m.currentStatus === 'OUTAGE')
    const hasMaintenance = monitors.some(m => m.currentStatus === 'MAINTENANCE')

    if (hasOutage) {
      return {
        text: t('status.someOutage'),
        colorClass: 'text-error-500',
        icon: statusMap.value.OUTAGE.icon
      }
    }
    if (hasMaintenance) {
      return {
        text: t('status.someMaintenance'),
        colorClass: 'text-warning-500',
        icon: statusMap.value.MAINTENANCE.icon
      }
    }
    return {
      text: t('status.allOperational'),
      colorClass: 'text-success-500',
      icon: statusMap.value.OPERATIONAL.icon
    }
  })

  // Last updated time
  const lastUpdated = computed(() => {
    if (!data.value?.monitors?.length) return null
    return formatTimeAgo(new Date(), t)
  })

  // Page title
  const pageTitle = computed(() => {
    if (pending.value) return t('status.loading')
    return data.value?.config?.title || t('status.title')
  })

  return {
    data,
    pending,
    error,
    statusMap,
    overallStatus,
    lastUpdated,
    pageTitle
  }
}
