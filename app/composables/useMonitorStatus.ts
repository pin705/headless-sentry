/**
 * Composable for monitor status utilities
 * Provides i18n support for monitor status labels and colors
 */
export const useMonitorStatus = () => {
  const { t } = useI18n()

  /**
   * Get status appearance (color and label) for a monitor row
   * @param row Monitor row with status and latestStatus properties
   * @returns Object with color and label for display
   */
  const getStatusAppearance = (row: { status?: string, latestStatus?: string }): { color: string, label: string } => {
    if (row.status === 'PAUSED') {
      return { color: 'warning', label: t('monitor.status.paused') }
    }
    if (row.latestStatus === 'UP') {
      return { color: 'success', label: t('monitor.status.up') }
    }
    if (row.latestStatus === 'DOWN') {
      return { color: 'error', label: t('monitor.status.down') }
    }
    return { color: 'neutral', label: t('monitor.status.na') }
  }

  return {
    getStatusAppearance
  }
}
