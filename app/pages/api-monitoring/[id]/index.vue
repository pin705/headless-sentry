<template>
  <UDashboardPanel :id="monitorId">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UButton
              to="/api-monitoring"
              icon="i-heroicons-arrow-left"
              color="neutral"
              variant="ghost"
              aria-label="Quay lại"
            />
            <h1
              v-if="monitorData"
              class="text-xl font-bold"
            >
              {{ monitorData.name }}
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
                :color="getStatusAppearance(latestResult).color"
                variant="soft"
                class="w-20 justify-center"
              >
                {{ getStatusAppearance(latestResult).label }}
              </UBadge>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Kiểm tra cuối: {{ formatTimeAgo(new Date(latestResult.timestamp)) }}
              </span>
            </div>
            <div v-else>
              <span class="text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu kiểm tra.</span>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Cấu hình
              </h3>
            </template>
            <div class="space-y-3">
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
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">
                  Lịch sử Độ trễ
                </h3>

                <div class="flex items-center gap-2">
                  <!-- <USelectMenu
                    v-model="selectedRange"
                    :items="rangeOptions"
                    value-key="key"
                    size="xs"
                    class="w-36"
                  /> -->

                  <DateRangePicker
                    v-model="range"
                    class="-ms-1"
                  />

                  <!-- <HomePeriodSelect v-model="period" :range="range" /> -->

                  <!-- <UPopover
                    :popper="{ placement: 'bottom-end' }"
                  >
                    <UButton
                      icon="i-heroicons-calendar-days-20-solid"
                      color="neutral"
                      variant="outline"
                      size="xs"
                    >
                      {{ new Date(customRange.start).toLocaleDateString() }} - {{ new Date(customRange.end).toLocaleDateString() }}
                    </UButton>

                    <template #content>
                      <UCalendar
                        v-model="customRange"
                        class="p-2"
                        range
                      />
                    </template>
                  </UPopover> -->
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
// (Mới) Import hàm xử lý ngày
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
// (Giả định component DatePicker đã được đăng ký global bởi Nuxt UI Pro)

const route = useRoute()
const toast = useToast()
const monitorId = route.params.id as string

const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const { data: monitorData, pending: pendingMonitor, error: errorMonitor } = await useFetch(
  `/api/monitors/${monitorId}`,
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

const rangeOptions = [
  { key: '1h', label: '1 Giờ qua' },
  { key: '6h', label: '6 Giờ qua' },
  { key: '24h', label: '24 Giờ qua' },
  { key: '7d', label: '7 Ngày qua' },
  { key: '30d', label: '30 Ngày qua' },
  { key: 'all', label: 'Tất cả thời gian' }
  // { key: 'custom', label: 'Tùy chỉnh...' }
]

// Bộ lọc bảng (Giữ nguyên)
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

// (Nâng cấp) Tham số query cho API
const queryParams = computed(() => {
  const params: any = {
    page: page.value,
    limit: limit.value,
    status: selectedStatus.value === 'all' ? undefined : selectedStatus.value,
    statusCode: selectedStatusCode.value === 'all' ? undefined : selectedStatusCode.value
  }

  // (Mới) Thêm ngày tùy chỉnh nếu range là 'custom'
  if (selectedRange.value === 'custom') {
    params.startDate = new Date(range.value.start)?.toISOString()
    params.endDate = new Date(range.value.end)?.toISOString()
  }

  return params
})

// (Nâng cấp) Reset về trang 1 khi bộ lọc thay đổi
watch([selectedRange, selectedStatus, selectedStatusCode, customRange], () => {
  page.value = 1
  console.log('Bộ lọc thay đổi, đặt lại trang về 1')
}, { deep: true }) // Thêm deep watch cho object `customRange`

// === 3. Lấy Dữ liệu Lịch sử (Phân trang & Lọc) ===
const { data: resultsData, pending: pendingResults, error: errorResults, refresh: refreshResults } = await useFetch(
  () => `/api/monitors/${monitorId}/results`,
  {
    query: queryParams,
    lazy: true,
    default: () => ({ results: [], total: 0, chartData: [] }),
    watch: [queryParams]
  }
)

// Dữ liệu cho UTable
const tableResults = computed(() => resultsData.value?.results || [])
// Dữ liệu cho UPagination
const totalResults = computed(() => resultsData.value?.total || 0)
// Dữ liệu cho kết quả mới nhất
const latestResult = computed(() => (monitorData.value.status))

// === 4. Logic Biểu đồ @unovis (Giữ nguyên) ===
const x = (d: { timestamp: string, latency: number }) => new Date(d.timestamp)
const y = (d: { timestamp: string, latency: number }) => d.latency

const chartData = computed(() => {
  return (resultsData.value?.chartData || []).map(item => ({
    timestamp: item.timestamp,
    latency: item.latency
  }))
  // API đã trả về sort (cũ -> mới)
})

// Định dạng nhãn trục X (ví dụ: "11:57 AM")
const formatDateTick = (value: number | Date) => {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const historyColumns = [
  { accessorKey: 'status', header: 'Trạng thái',
    cell: ({ row }: any) => {
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
          text: errorMessage, // Nội dung lỗi
          popper: { placement: 'top', arrow: true }
        }, () => icon) // Chỉ bọc icon

        return h('div', { class: 'flex items-center gap-1' }, [
          badge,
          tooltip
        ])
      }

      // 3. Nếu UP, hoặc DOWN (nhưng không có lỗi), chỉ trả về UBadge
      return badge
    }
  },
  { accessorKey: 'statusCode', header: 'Mã HTTP',
    cell: ({ row }: any) => h('span', { class: 'font-mono' }, row.original.statusCode)
  },
  { accessorKey: 'latency', header: 'Độ trễ',
    cell: ({ row }: any) => h('span', { class: 'font-mono' }, `${row.original.latency} ms`)
  },
  { accessorKey: 'timestamp', header: 'Thời gian',
    cell: ({ row }: any) => {
      // (MỚI) Bọc trong NuxtLink
      // (Tuân thủ Rule 3)
      const resultId = row.original._id
      const monitorId = route.params.id // Lấy monitorId từ route hiện tại
      const linkTo = `/api-monitoring/${monitorId}/results/${resultId}`
      const timeAgo = formatTimeAgo(new Date(row.original.timestamp))

      // Dùng component NuxtLink để điều hướng
      return h(resolveComponent('NuxtLink'), {
        to: linkTo,
        class: 'text-sm text-primary-500 dark:text-primary-400 hover:underline cursor-pointer' // Style như link
      }, () => timeAgo) // Nội dung link là thời gian
    }
  },
]
</script>
