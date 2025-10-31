<template>
  <UDashboardPanel :id="monitorId">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UButton
              :to="`/${projectId}/monitoring`"
              icon="i-heroicons-arrow-left"
              color="neutral"
              variant="ghost"
              aria-label="Quay lại"
            />
            <h1
              v-if="monitorData"
              class="text-xl font-bold"
            >
              {{ monitorData.name || 'Chưa đặt tên' }}
            </h1>
            <h1
              v-else-if="pendingMonitor"
              class="text-xl font-bold"
            >
              Đang tải...
            </h1>
            <h1
              v-else
              class="text-xl font-bold text-error-500"
            >
              Không tìm thấy
            </h1>
          </div>
        </template>
        <template #right>
          <UButton
            :icon="pendingResults ? 'i-heroicons-arrow-path-solid' : 'i-heroicons-arrow-path'"
            :loading="pendingResults"
            variant="ghost"
            color="neutral"
            aria-label="Làm mới"
            @click="refreshResults()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="errorMonitor || errorResults"
        class="p-4"
      >
        <p class="text-error-500">
          {{ errorMonitor?.data?.message || errorResults?.data?.message || 'Không thể tải dữ liệu.' }}
        </p>
      </div>

      <div
        v-else-if="monitorData"
        class="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div class="lg:col-span-1 space-y-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Trạng thái Hiện tại
              </h3>
            </template>
            <div
              v-if="latestResult"
              class="flex items-center gap-2"
            >
              <UBadge
                :color="getStatusUBadge(latestResult).color"
                variant="soft"
                class="w-20 justify-center"
              >
                {{ getStatusUBadge(latestResult).label }}
              </UBadge>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Kiểm tra cuối: {{ formatTimeAgo(new Date(latestResult.timestamp)) }}
              </span>
            </div>
            <div v-else>
              <span class="text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu kiểm tra.</span>
            </div>
          </UCard>

          <UCard v-if="monitorData.type === 'server' && latestServerMetrics">
            <template #header>
              <h3 class="font-semibold">
                Metrics Hiện tại
              </h3>
            </template>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">CPU:</span>
                <div class="flex items-center gap-2">
                  <div class="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="latestServerMetrics.cpuUsage > (monitorData.serverConfig?.cpuThreshold || 80) ? 'bg-error-500' : 'bg-warning-500'"
                      :style="{ width: `${Math.min(latestServerMetrics.cpuUsage, 100)}%` }"
                    />
                  </div>
                  <span class="text-sm font-mono font-semibold w-12 text-right">{{ latestServerMetrics.cpuUsage }}%</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">RAM:</span>
                <div class="flex items-center gap-2">
                  <div class="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="latestServerMetrics.memoryUsage > (monitorData.serverConfig?.memoryThreshold || 80) ? 'bg-error-500' : 'bg-purple-500'"
                      :style="{ width: `${Math.min(latestServerMetrics.memoryUsage, 100)}%` }"
                    />
                  </div>
                  <span class="text-sm font-mono font-semibold w-12 text-right">{{ latestServerMetrics.memoryUsage }}%</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Disk:</span>
                <div class="flex items-center gap-2">
                  <div class="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="latestServerMetrics.diskUsage > (monitorData.serverConfig?.diskThreshold || 90) ? 'bg-error-500' : 'bg-blue-500'"
                      :style="{ width: `${Math.min(latestServerMetrics.diskUsage, 100)}%` }"
                    />
                  </div>
                  <span class="text-sm font-mono font-semibold w-12 text-right">{{ latestServerMetrics.diskUsage }}%</span>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Cấu hình
              </h3>
            </template>
            <div
              v-if="monitorData.type === 'server'"
              class="space-y-3"
            >
              <div class="flex justify-between">
                <span class="text-sm font-medium">Server:</span>
                <span class="text-sm font-mono truncate max-w-xs">{{ monitorData.endpoint }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Loại:</span>
                <span class="text-sm">Server Monitoring</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Ngưỡng CPU:</span>
                <span class="text-sm">{{ monitorData.serverConfig?.cpuThreshold || 80 }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Ngưỡng RAM:</span>
                <span class="text-sm">{{ monitorData.serverConfig?.memoryThreshold || 80 }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Ngưỡng Disk:</span>
                <span class="text-sm">{{ monitorData.serverConfig?.diskThreshold || 90 }}%</span>
              </div>
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div class="flex justify-between">
                <span class="text-sm font-medium">Endpoint:</span>
                <span class="text-sm font-mono truncate max-w-xs">{{ monitorData.endpoint }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Method:</span>
                <span class="text-sm font-mono">{{ monitorData.method }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Tần suất:</span>
                <span class="text-sm">{{ monitorData.frequency / 60 }} phút/lần</span>
              </div>
            </div>
          </UCard>
        </div>

        <div class="lg:col-span-2 space-y-4">
          <!-- Server Metrics Charts -->
          <template v-if="monitorData.type === 'server'">
            <UCard>
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="font-semibold">
                    CPU Usage
                  </h3>
                  <DateRangePicker
                    v-model="range"
                    class="-ms-1"
                  />
                </div>
              </template>
              <VisXYContainer
                v-if="serverCpuData.length > 1"
                :data="serverCpuData"
                :x="xServer"
                :y="yCpu"
                class="h-64"
              >
                <VisLine
                  :x="xServer"
                  :y="yCpu"
                  color="#f59e0b"
                />
                <VisAxis
                  type="x"
                  :tick-format="formatDateTick"
                />
                <VisAxis
                  type="y"
                  :tick-format="(v: number) => `${v}%`"
                />
                <VisTooltip />
              </VisXYContainer>
              <div
                v-else
                class="h-64 flex items-center justify-center"
              >
                <p class="text-gray-500">
                  Không đủ dữ liệu để vẽ biểu đồ.
                </p>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">
                  Memory Usage
                </h3>
              </template>
              <VisXYContainer
                v-if="serverMemoryData.length > 1"
                :data="serverMemoryData"
                :x="xServer"
                :y="yMemory"
                class="h-64"
              >
                <VisLine
                  :x="xServer"
                  :y="yMemory"
                  color="#8b5cf6"
                />
                <VisAxis
                  type="x"
                  :tick-format="formatDateTick"
                />
                <VisAxis
                  type="y"
                  :tick-format="(v: number) => `${v}%`"
                />
                <VisTooltip />
              </VisXYContainer>
              <div
                v-else
                class="h-64 flex items-center justify-center"
              >
                <p class="text-gray-500">
                  Không đủ dữ liệu để vẽ biểu đồ.
                </p>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">
                  Disk Usage
                </h3>
              </template>
              <VisXYContainer
                v-if="serverDiskData.length > 1"
                :data="serverDiskData"
                :x="xServer"
                :y="yDisk"
                class="h-64"
              >
                <VisLine
                  :x="xServer"
                  :y="yDisk"
                  color="#ef4444"
                />
                <VisAxis
                  type="x"
                  :tick-format="formatDateTick"
                />
                <VisAxis
                  type="y"
                  :tick-format="(v: number) => `${v}%`"
                />
                <VisTooltip />
              </VisXYContainer>
              <div
                v-else
                class="h-64 flex items-center justify-center"
              >
                <p class="text-gray-500">
                  Không đủ dữ liệu để vẽ biểu đồ.
                </p>
              </div>
            </UCard>
          </template>

          <!-- HTTP/Ping/Keyword Latency Chart -->
          <UCard v-else>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">
                  Lịch sử Độ trễ
                </h3>

                <div class="flex items-center gap-2">
                  <DateRangePicker
                    v-model="range"
                    class="-ms-1"
                  />
                </div>
              </div>
            </template>
            <VisXYContainer
              v-if="chartData.length > 1"
              :data="chartData"
              :x="x"
              :y="y"
              class="h-64"
            >
              <VisLine
                :x="x"
                :y="y"
                color="#10b981"
              />
              <VisAxis
                type="x"
                :tick-format="formatDateTick"
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
                Không đủ dữ liệu để vẽ biểu đồ.
              </p>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">
                  Lịch sử Kiểm tra Chi tiết
                </h3>
                <div class="flex items-center gap-2">
                  <USelectMenu
                    v-model="selectedStatus"
                    :items="statusOptions"
                    value-key="key"
                    placeholder="Trạng thái (UP/DOWN)"
                    size="xs"
                    class="w-40"
                  />
                  <USelectMenu
                    v-model="selectedStatusCode"
                    :items="statusCodeOptions"
                    value-key="key"
                    placeholder="Mã HTTP"
                    size="xs"
                    class="w-40"
                  />
                </div>
              </div>
            </template>

            <div>
              <UTable
                :data="tableResults"
                :columns="historyColumns"
                :loading="pendingResults"
                :empty-state="{ icon: 'i-heroicons-search', label: 'Không tìm thấy kết quả.' }"
              />
              <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
                <UPagination
                  v-model="page"
                  :page-count="limit"
                  :total="totalResults"
                  @update:page="(p) => {
                    page = p
                  }"
                />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, ref, computed, watch } from 'vue'
import { sub } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisTooltip } from '@unovis/vue'
import { CalendarDate } from '@internationalized/date'

const route = useRoute()
const monitorId = route.params.monitorId as string
const projectId = route.params.projectId as string

const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const { data: monitorData, pending: pendingMonitor, error: errorMonitor } = await useFetch(
  `/api/projects/${projectId}/monitors/${monitorId}`,
  { lazy: true }
)

// === 2. State cho các Bộ lọc ===
const page = ref(1)
const limit = ref(10) // Số item mỗi trang

// Bộ lọc thời gian (Nâng cấp)
const selectedRange = ref('custom')
const customRange = ref({
  start: new CalendarDate(2025, 1, 20),
  end: new CalendarDate(2025, 2, 10)
})

const selectedStatus = ref('all') // UP/DOWN
const selectedStatusCode = ref('all') // 2xx/3xx...

const statusOptions = [
  { key: 'all', label: 'Tất cả Trạng thái' },
  { key: 'UP', label: 'UP' },
  { key: 'DOWN', label: 'DOWN' }
]
const statusCodeOptions = [
  { key: 'all', label: 'Tất cả Mã HTTP' },
  { key: '2xx', label: 'Thành công (2xx)' },
  { key: '3xx', label: 'Chuyển hướng (3xx)' },
  { key: '4xx', label: 'Lỗi Client (4xx)' },
  { key: '5xx', label: 'Lỗi Server (5xx)' }
]

const queryParams = computed(() => {
  const params = {
    page: page.value,
    limit: limit.value,
    status: selectedStatus.value === 'all' ? undefined : selectedStatus.value,
    statusCode: selectedStatusCode.value === 'all' ? undefined : selectedStatusCode.value,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined
  }

  // (Mới) Thêm ngày tùy chỉnh nếu range là 'custom'
  if (selectedRange.value === 'custom') {
    params.startDate = new Date(range.value.start)?.toISOString()
    params.endDate = new Date(range.value.end)?.toISOString()
  }

  return params
})

watch([selectedRange, selectedStatus, selectedStatusCode, customRange], () => {
  page.value = 1
  console.log('Bộ lọc thay đổi, đặt lại trang về 1')
}, { deep: true }) // Thêm deep watch cho object `customRange`

const { data: resultsData, pending: pendingResults, error: errorResults, refresh: refreshResults } = await useFetch(
  () => `/api/projects/${projectId}/monitors/${monitorId}/results`,
  {
    query: queryParams,
    lazy: true,
    default: () => ({ results: [], total: 0, chartData: [] }),
    watch: [queryParams]
  }
)
const tableResults = computed(() => resultsData.value?.results || [])
const totalResults = computed(() => resultsData.value?.total || 0)
const latestResult = computed(() => (monitorData.value.status))

const latestServerMetrics = computed(() => {
  if (monitorData.value?.type !== 'server') return null
  const results = resultsData.value?.results || []
  if (results.length === 0) return null

  const latestResult = results[0]
  return latestResult.serverMetrics || null
})

const x = (d: { timestamp: string, latency: number }) => new Date(d.timestamp)
const y = (d: { timestamp: string, latency: number }) => d.latency

const chartData = computed(() => {
  return (resultsData.value?.chartData || []).map(item => ({
    timestamp: item.timestamp,
    latency: item.latency
  }))
  // API đã trả về sort (cũ -> mới)
})

// Server metrics chart data
interface ServerMetricData {
  timestamp: string
  cpuUsage?: number
  memoryUsage?: number
  diskUsage?: number
}

const xServer = (d: ServerMetricData) => new Date(d.timestamp)
const yCpu = (d: ServerMetricData) => d.cpuUsage
const yMemory = (d: ServerMetricData) => d.memoryUsage
const yDisk = (d: ServerMetricData) => d.diskUsage

const serverCpuData = computed(() => {
  if (monitorData.value?.type !== 'server') return []
  return (resultsData.value?.chartData || [])
    .filter(item => item.serverMetrics?.cpuUsage != null)
    .map(item => ({
      timestamp: item.timestamp,
      cpuUsage: item.serverMetrics.cpuUsage
    }))
})

const serverMemoryData = computed(() => {
  if (monitorData.value?.type !== 'server') return []
  return (resultsData.value?.chartData || [])
    .filter(item => item.serverMetrics?.memoryUsage != null)
    .map(item => ({
      timestamp: item.timestamp,
      memoryUsage: item.serverMetrics.memoryUsage
    }))
})

const serverDiskData = computed(() => {
  if (monitorData.value?.type !== 'server') return []
  return (resultsData.value?.chartData || [])
    .filter(item => item.serverMetrics?.diskUsage != null)
    .map(item => ({
      timestamp: item.timestamp,
      diskUsage: item.serverMetrics.diskUsage
    }))
})

// Định dạng nhãn trục X (ví dụ: "11:57 AM")
const formatDateTick = (value: number | Date) => {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function getStatusUBadge(latestResult: string) {
  if (latestResult === 'ACTIVE') {
    return { color: 'success', label: latestResult }
  }
  return { color: 'error', label: latestResult }
}

interface RowData {
  original: {
    isUp: boolean
    errorMessage?: string
    serverMetrics?: {
      cpuUsage?: number
      memoryUsage?: number
      diskUsage?: number
    }
    statusCode?: number
    latency?: number
    timestamp: string
    _id: string
  }
}

const historyColumns = computed(() => {
  const baseColumns = [
    { accessorKey: 'status', header: 'Trạng thái',
      cell: ({ row }: RowData) => {
        const isUp = row.original.isUp
        const errorMessage = row.original.errorMessage
        const color = isUp ? 'success' : 'error'
        const label = isUp ? 'UP' : 'DOWN'

        const badge = h(UBadge, { color: color, variant: 'soft' }, () => label)

        if (!isUp && errorMessage) {
          const icon = h(UIcon, {
            name: 'i-heroicons-exclamation-circle-solid',
            class: 'text-error-500 dark:text-error-400 cursor-help'
          })

          const tooltip = h(UTooltip, {
            text: errorMessage,
            popper: { placement: 'top', arrow: true }
          }, () => icon)

          return h('div', { class: 'flex items-center gap-1' }, [
            badge,
            tooltip
          ])
        }

        return badge
      }
    }
  ]

  // For server monitors, show CPU, Memory, Disk instead of statusCode and latency
  if (monitorData.value?.type === 'server') {
    baseColumns.push(
      { accessorKey: 'cpuUsage', header: 'CPU',
        cell: ({ row }: RowData) => {
          const cpuUsage = row.original.serverMetrics?.cpuUsage
          return h('span', { class: 'font-mono' }, cpuUsage != null ? `${cpuUsage}%` : '--')
        }
      },
      { accessorKey: 'memoryUsage', header: 'RAM',
        cell: ({ row }: RowData) => {
          const memoryUsage = row.original.serverMetrics?.memoryUsage
          return h('span', { class: 'font-mono' }, memoryUsage != null ? `${memoryUsage}%` : '--')
        }
      },
      { accessorKey: 'diskUsage', header: 'Disk',
        cell: ({ row }: RowData) => {
          const diskUsage = row.original.serverMetrics?.diskUsage
          return h('span', { class: 'font-mono' }, diskUsage != null ? `${diskUsage}%` : '--')
        }
      }
    )
  } else {
    // For HTTP/Ping/Keyword monitors, show statusCode and latency
    baseColumns.push(
      { accessorKey: 'statusCode', header: 'Mã HTTP',
        cell: ({ row }: RowData) => h('span', { class: 'font-mono' }, row.original.statusCode)
      },
      { accessorKey: 'latency', header: 'Độ trễ',
        cell: ({ row }: RowData) => h('span', { class: 'font-mono' }, `${row.original.latency} ms`)
      }
    )
  }

  // Timestamp column is common for all monitor types
  baseColumns.push(
    { accessorKey: 'timestamp', header: 'Thời gian',
      cell: ({ row }: RowData) => {
        const resultId = row.original._id
        const linkTo = `/${projectId}/monitoring/${monitorId}/results/${resultId}`
        const timeAgo = formatTimeAgo(new Date(row.original.timestamp))

        return h(resolveComponent('NuxtLink'), {
          to: linkTo,
          class: 'text-sm text-primary-500 dark:text-primary-400 hover:underline cursor-pointer'
        }, () => timeAgo)
      }
    }
  )

  return baseColumns
})
</script>
