<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tổng quan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            :icon="pending ? 'i-heroicons-arrow-path-solid' : 'i-heroicons-arrow-path'"
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
        class="p-4 space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Tổng số</span><UIcon
                  name="i-lucide-server"
                  class="w-5 h-5 text-gray-400 dark:text-gray-500"
                />
              </div>
            </template>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold">{{ data.totalMonitors }}</span><span class="text-sm">dịch vụ</span>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-success-500">Đang Hoạt động</span><UIcon
                  name="i-lucide-check-circle"
                  class="w-5 h-5 text-success-400"
                />
              </div>
            </template>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold">{{ data.totalUp }}</span><span
                v-if="data.totalDown > 0 || data.totalPaused > 0"
                class="text-sm"
              >/ {{ data.totalMonitors - data.totalPaused }}</span>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-error-500">Ngưng hoạt động</span><UIcon
                  name="i-lucide-alert-triangle"
                  class="w-5 h-5 text-error-400"
                />
              </div>
            </template>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold">{{ data.totalDown }}</span><span
                v-if="data.totalPaused > 0"
                class="text-sm text-neutral-500"
              >({{ data.totalPaused }} tạm dừng)</span>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Uptime (24 Giờ)</span><UIcon
                  name="i-lucide-shield-check"
                  class="w-5 h-5 text-gray-400 dark:text-gray-500"
                />
              </div>
            </template>
            <div class="flex items-baseline gap-2">
              <span
                class="text-3xl font-bold"
                :class="uptimeColorClass"
              >
                <span v-if="data.uptimePercent24h < 99.99 && data.uptimePercent24h > 90">{{ data.uptimePercent24h.toFixed(2) }}</span>
                <span v-else>{{ data.uptimePercent24h.toFixed(0) }}</span>%
              </span>
              <span class="text-sm">/ {{ data.avgLatency24h }} ms</span>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Độ trễ trung bình (24 Giờ qua - Tính theo giờ)
            </h3>
          </template>
          <VisXYContainer
            v-if="latencyChartFormattedData.length > 1"
            :data="latencyChartFormattedData"
            :x="xLatency"
            :y="yLatency"
            class="h-64"
          >
            <VisLine
              :x="xLatency"
              :y="yLatency"
              color="#3b82f6"
            /> <VisAxis
              type="x"
              :tick-format="formatHourTick"
              :grid-line="false"
            />
            <VisAxis
              type="y"
              :tick-format="(v: number) => `${v} ms`"
            />
            <VisTooltip />
          </VisXYContainer>
          <div
            v-else
            class="h-64 flex items-center justify-center"
          >
            <p class="text-gray-500">
              Không đủ dữ liệu để vẽ biểu đồ độ trễ.
            </p>
          </div>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Lỗi Gần Đây (24 Giờ)
              </h3>
            </template>
            <UTable
              :data="data.recentErrors"
              :columns="errorColumns"
              :empty-state="{ icon: 'i-heroicons-check-circle', label: 'Không có lỗi nào gần đây. Tuyệt vời!' }"
              :ui="{ td: { padding: 'py-2 px-3' } }"
            />
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Cảnh Báo Đã Gửi (24 Giờ)
              </h3>
            </template>
            <UTable
              :data="data.recentAlerts"
              :columns="alertColumns"
              :empty-state="{ icon: 'i-heroicons-bell-slash', label: 'Không có cảnh báo nào được gửi gần đây.' }"
              :ui="{ td: { padding: 'py-2 px-3' } }"
            />
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import { VisXYContainer, VisLine, VisAxis, VisTooltip } from '@unovis/vue'

// === Data Fetching ===
const { data, pending, error, refresh } = await useFetch('/api/dashboard/stats', {
  lazy: true,
  // Cung cấp default value đầy đủ hơn
  default: () => ({
    totalMonitors: 0, totalUp: 0, totalDown: 0, totalPaused: 0,
    uptimePercent24h: 100, avgLatency24h: 0,
    latencyChartData: [], recentErrors: [], recentAlerts: []
  })
})

if (error.value) {
  console.error('Lỗi tải dashboard stats:', error.value)
  // Có thể dùng useToast ở đây nếu cần
}

// === Logic Biểu đồ Latency ===
const xLatency = (d: { hour: string, avgLatency: number }) => new Date(d.hour)
const yLatency = (d: { hour: string, avgLatency: number }) => d.avgLatency

const latencyChartFormattedData = computed(() => {
  return (data.value?.latencyChartData || []).map(item => ({
    hour: item.hour,
    avgLatency: item.avgLatency
  }))
})

const formatHourTick = (value: number | Date) => {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// === Logic Bảng Lỗi Gần Đây ===
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

// (Tuân thủ Rule 5)
const errorColumns = [
  { accessorKey: 'monitor', header: 'Dịch vụ',
    cell: ({ row }: any) => {
      // (Tuân thủ Rule 3)
      const monitor = row.original.meta?.monitorId // monitorId đã được populate
      return monitor
        ? h('span', { class: 'text-sm font-medium hover:underline cursor-pointer', onClick: () => navigateTo(`/api-monitoring/${monitor._id}`) }, monitor.name) // Link tới trang chi tiết
        : h('span', { class: 'text-sm text-gray-500' }, 'N/A')
    }
  },
  { accessorKey: 'error', header: 'Chi tiết lỗi',
    cell: ({ row }: any) => {
      // (Tuân thủ Rule 3, 7)
      const statusCode = row.original.statusCode
      const errorMessage = row.original.errorMessage || 'Lỗi không xác định'
      // Hiển thị message đầy đủ trong tooltip, cắt ngắn trên bảng
      const shortError = errorMessage.substring(0, 60) + (errorMessage.length > 60 ? '...' : '')
      const errorText = `[${statusCode}] ${shortError}`

      // Luôn dùng Tooltip để hiển thị message đầy đủ
      return h(UTooltip, {
        text: errorMessage,
        popper: { placement: 'top-start', arrow: true }
      }, () => h('span', { class: 'text-sm text-error-500 cursor-help' }, errorText))
    }
  },
  { accessorKey: 'timestamp', header: 'Thời gian', class: 'w-32 text-right',
    cell: ({ row }: any) => h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, formatTimeAgo(new Date(row.original.timestamp)))
  }
]

// === Logic Bảng Cảnh Báo Gần Đây ===
const alertColumns = [
  { accessorKey: 'name', header: 'Dịch vụ',
    cell: ({ row }: any) => h('span', { class: 'text-sm font-medium hover:underline cursor-pointer', onClick: () => navigateTo(`/api-monitoring/${row.original._id}`) }, row.original.name) // Link tới trang chi tiết
  },
  { accessorKey: 'alertTime', header: 'Gửi lúc', class: 'w-32 text-right',
    // (Tuân thủ Rule 3)
    cell: ({ row }: any) => h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, formatTimeAgo(new Date(row.original.alertConfig.lastAlertedAt)))
  }
]

// === Logic màu Uptime ===
// (Tuân thủ Rule 7)
const uptimeColorClass = computed(() => {
  if (!data.value) return 'text-neutral-500'
  const uptime = data.value.uptimePercent24h
  if (uptime >= 99.9) return 'text-success-500' // Chỉ xanh khi > 99.9
  if (uptime >= 99) return 'text-warning-500' // Vàng từ 99 - 99.9
  return 'text-error-500' // Đỏ nếu < 99
})
</script>
