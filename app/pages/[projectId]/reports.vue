<template>
  <div>
    <UDashboardPanel id="reports">
      <template #header>
        <UDashboardNavbar title="Báo cáo SLA & Uptime">
          <template #right>
            <USelectMenu
              v-model="selectedDays"
              :items="daysOptions"
              value-key="value"
              @change="refresh()"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              :loading="pending"
              variant="ghost"
              color="neutral"
              aria-label="Làm mới"
              class="ml-2"
              @click="refresh()"
            />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6">
          <div
            v-if="pending"
            class="flex items-center justify-center h-64"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-gray-500 w-8 h-8"
            />
          </div>

          <div
            v-else-if="error"
            class="text-error-500"
          >
            Không thể tải báo cáo.
          </div>

          <div
            v-else-if="data"
            class="space-y-6"
          >
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UCard>
                <div class="text-center">
                  <div class="text-3xl font-bold text-primary">
                    {{ data.summary.totalMonitors }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tổng số Monitors
                  </div>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <div class="text-3xl font-bold text-success">
                    {{ data.summary.avgUptimePercentage }}%
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Uptime trung bình
                  </div>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <div class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ data.period.days }} ngày
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Khoảng thời gian
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Monitor Reports Table -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">
                  Chi tiết từng Monitor
                </h3>
              </template>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tên Monitor
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Loại
                      </th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Uptime
                      </th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Checks
                      </th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Downtime
                      </th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avg Latency
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr
                      v-for="monitor in data.monitors"
                      :key="monitor.monitorId"
                      class="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {{ monitor.monitorName }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        <UBadge
                          :color="getTypeColor(monitor.monitorType)"
                          variant="subtle"
                        >
                          {{ monitor.monitorType }}
                        </UBadge>
                      </td>
                      <td class="px-4 py-3 text-sm text-center">
                        <div
                          class="font-semibold"
                          :class="getUptimeColor(monitor.uptimePercentage)"
                        >
                          {{ monitor.uptimePercentage }}%
                        </div>
                      </td>
                      <td class="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
                        {{ monitor.successfulChecks }} / {{ monitor.totalChecks }}
                      </td>
                      <td class="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
                        {{ monitor.downtimeIncidents }} lần
                      </td>
                      <td class="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
                        {{ monitor.avgLatency }}ms
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const route = useRoute()
const projectId = route.params.projectId as string

const selectedDays = ref(30)
const daysOptions = [
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
  { label: '90 ngày', value: 90 }
]

const apiUrl = computed(() => `/api/projects/${projectId}/reports/sla?days=${selectedDays.value}`)

const { data, pending, error, refresh } = await useFetch(apiUrl.value, {
  watch: [selectedDays]
})

function getUptimeColor(uptime: string | number) {
  const uptimeNum = typeof uptime === 'string' ? parseFloat(uptime) : uptime
  if (uptimeNum >= 99.9) return 'text-success-600 dark:text-success-400'
  if (uptimeNum >= 99) return 'text-success-500'
  if (uptimeNum >= 95) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    http: 'primary',
    keyword: 'secondary',
    ping: 'info',
    heartbeat: 'success'
  }
  return colors[type] || 'neutral'
}
</script>
