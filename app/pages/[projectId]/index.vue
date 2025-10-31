<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tổng quan">
        <!-- <template #leading>
          <UDashboardSidebarCollapse />
        </template> -->

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="ghost"
            color="neutral"
            aria-label="Làm mới"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="pending"
        class="p-4 flex items-center justify-center h-64"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-gray-500 w-8 h-8"
        />
      </div>
      <div
        v-else-if="error"
        class="p-4"
      >
        <p class="text-error-500">
          Không thể tải thống kê trang tổng quan.
        </p>
      </div>

      <div
        v-else-if="data"
        class="p-6 space-y-6"
      >
        <!-- Helpful Tips Banner -->
        <UAlert
          v-if="data.totalMonitors === 0"
          icon="i-lucide-lightbulb"
          color="primary"
          variant="soft"
          title="Bắt đầu với Headless Sentry"
          description="Thêm dịch vụ giám sát đầu tiên của bạn để theo dõi uptime, hiệu suất và nhận cảnh báo khi có sự cố."
        >
          <template #actions>
            <UButton
              color="primary"
              variant="soft"
              label="Thêm Dịch vụ"
              icon="i-lucide-plus"
              :to="`/${$route.params.projectId}/monitoring`"
            />
          </template>
        </UAlert>

        <UAlert
          v-else-if="data.totalMonitors > 0 && data.totalDown > 0"
          icon="i-lucide-alert-circle"
          color="error"
          variant="soft"
          :title="`${data.totalDown} dịch vụ đang ngưng hoạt động`"
          description="Một số dịch vụ của bạn đang gặp sự cố. Vui lòng kiểm tra và xử lý."
        >
          <template #actions>
            <UButton
              color="error"
              variant="soft"
              label="Xem chi tiết"
              icon="i-lucide-external-link"
              :to="`/${$route.params.projectId}/monitoring`"
            />
          </template>
        </UAlert>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Tổng số"
            :value="data.totalMonitors"
            unit="dịch vụ"
            icon="i-lucide-server"
            variant="default"
          />
          <StatsCard
            label="Đang Hoạt động"
            :value="data.totalUp"
            :subtitle="data.totalDown > 0 || data.totalPaused > 0 ? `/ ${data.totalMonitors - data.totalPaused}` : undefined"
            icon="i-lucide-check-circle"
            variant="success"
          />
          <StatsCard
            label="Ngưng hoạt động"
            :value="data.totalDown"
            :subtitle="data.totalPaused > 0 ? `(${data.totalPaused} tạm dừng)` : undefined"
            icon="i-lucide-alert-triangle"
            variant="error"
          />
          <StatsCard
            label="Uptime (24 Giờ)"
            :value="formatUptime(data.uptimePercent24h)"
            :subtitle="`/ ${data.avgLatency24h} ms`"
            icon="i-lucide-shield-check"
            :variant="getUptimeVariant(data.uptimePercent24h)"
          />
        </div>

        <LatencyChart
          :data="data.latencyChartData || []"
          title="Độ trễ trung bình (24 Giờ qua)"
          empty-message="Không đủ dữ liệu để vẽ biểu đồ độ trễ."
        />

        <!-- Monitor Types Overview -->
        <UCard v-if="data.monitorsByType && Object.keys(data.monitorsByType).length > 0">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                Phân loại Giám sát
              </h3>
              <UTooltip text="Xem phân bổ các loại giám sát trong dự án">
                <UIcon
                  name="i-lucide-info"
                  class="w-4 h-4 text-gray-400 cursor-help"
                />
              </UTooltip>
            </div>
          </template>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(count, type) in data.monitorsByType"
              :key="type"
              class="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <UIcon
                :name="getMonitorTypeIcon(type)"
                class="w-8 h-8 mb-2"
                :class="getMonitorTypeColor(type)"
              />
              <div class="text-2xl font-bold">
                {{ count }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 uppercase">
                {{ getMonitorTypeLabel(type) }}
              </div>
            </div>
          </div>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertTable
            :data="data.recentErrors"
            :columns="errorColumns"
            title="Lỗi Gần Đây (24 Giờ)"
            empty-message="Không có lỗi nào gần đây. Tuyệt vời!"
            empty-icon="i-lucide-check-circle"
          />

          <AlertTable
            :data="data.recentAlerts"
            :columns="alertColumns"
            title="Cảnh Báo Đã Gửi (24 Giờ)"
            empty-message="Không có cảnh báo nào được gửi gần đây."
            empty-icon="i-lucide-bell-off"
          />
        </div>

        <!-- Quick Actions Card -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Hành động nhanh
            </h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UButton
              icon="i-lucide-plus-circle"
              label="Thêm Giám sát"
              color="primary"
              variant="soft"
              block
              :to="`/${$route.params.projectId}/monitoring`"
            />
            <UButton
              icon="i-lucide-wrench"
              label="Bảo trì"
              color="neutral"
              variant="soft"
              block
              :to="`/${$route.params.projectId}/maintenance`"
            />
            <UButton
              icon="i-lucide-chart-bar"
              label="Báo cáo SLA"
              color="neutral"
              variant="soft"
              block
              :to="`/${$route.params.projectId}/reports`"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h } from 'vue'

const route = useRoute()
const projectId = route.params.projectId as string

// === Data Fetching ===
const { data, pending, error, refresh } = await useFetch(`/api/projects/${projectId}/dashboard`, {
  lazy: true,
  default: () => ({
    totalMonitors: 0,
    totalUp: 0,
    totalDown: 0,
    totalPaused: 0,
    uptimePercent24h: 100,
    avgLatency24h: 0,
    latencyChartData: [],
    recentErrors: [],
    recentAlerts: []
  })
})

if (error.value) {
  console.error('Lỗi tải dashboard stats:', error.value)
}

// === Logic Bảng Lỗi Gần Đây ===
const UTooltip = resolveComponent('UTooltip')

interface RowContext {
  original: Record<string, unknown>
}

const errorColumns = [
  {
    accessorKey: 'monitor',
    header: 'Dịch vụ',
    cell: ({ row }: { row: RowContext }) => {
      const monitor = (row.original.meta as Record<string, unknown>)?.monitorId as { _id: string, name: string } | undefined
      return monitor
        ? h('span', { class: 'text-sm font-medium hover:underline cursor-pointer', onClick: () => navigateTo(`/monitoring/${monitor._id}`) }, monitor.name)
        : h('span', { class: 'text-sm text-gray-500' }, 'N/A')
    }
  },
  {
    accessorKey: 'error',
    header: 'Chi tiết lỗi',
    cell: ({ row }: { row: RowContext }) => {
      const statusCode = row.original.statusCode as number
      const errorMessage = (row.original.errorMessage as string) || 'Lỗi không xác định'
      const shortError = errorMessage.substring(0, 60) + (errorMessage.length > 60 ? '...' : '')
      const errorText = `[${statusCode}] ${shortError}`

      return h(UTooltip, {
        text: errorMessage,
        popper: { placement: 'top-start', arrow: true }
      }, () => h('span', { class: 'text-sm text-error-500 cursor-help' }, errorText))
    }
  },
  {
    accessorKey: 'timestamp',
    header: 'Thời gian',
    class: 'w-32 text-right',
    cell: ({ row }: { row: RowContext }) => h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, formatTimeAgo(new Date(row.original.timestamp as string)))
  }
]

const alertColumns = [
  {
    accessorKey: 'name',
    header: 'Dịch vụ',
    cell: ({ row }: { row: RowContext }) => h('span', { class: 'text-sm font-medium hover:underline cursor-pointer', onClick: () => navigateTo(`/monitoring/${row.original._id as string}`) }, row.original.name as string)
  },
  {
    accessorKey: 'alertTime',
    header: 'Gửi lúc',
    class: 'w-32 text-right',
    cell: ({ row }: { row: RowContext }) => h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, formatTimeAgo(new Date((row.original.alertConfig as Record<string, unknown>).lastAlertedAt as string)))
  }
]

// === Helper Functions for StatsCard ===
function formatUptime(uptime: number): string {
  if (uptime < 99.99 && uptime > 90) {
    return `${uptime.toFixed(2)}%`
  }
  return `${uptime.toFixed(0)}%`
}

function getUptimeVariant(uptime: number): 'success' | 'warning' | 'error' {
  if (uptime >= 99.9) return 'success'
  if (uptime >= 99) return 'warning'
  return 'error'
}

// Import shared monitor type utilities
const { getMonitorTypeIcon, getMonitorTypeColor, getMonitorTypeLabel } = await import('~/utils/monitorTypes')
</script>
