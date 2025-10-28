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
        class="p-4"
      >
        <p>Đang tải thống kê...</p>
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
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4"
      >
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Tổng số</span>
              <UIcon
                name="i-lucide-server"
                class="w-5 h-5 text-gray-400 dark:text-gray-500"
              />
            </div>
          </template>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold">{{ data.totalMonitors }}</span>
            <span class="text-sm">monitors</span>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-success-500">Đang Hoạt động</span>
              <UIcon
                name="i-lucide-check-circle"
                class="w-5 h-5 text-success-400"
              />
            </div>
          </template>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold">{{ data.totalUp }}</span>
            <span
              v-if="data.totalDown > 0"
              class="text-sm"
            >/ {{ data.totalMonitors - data.totalPaused }}</span>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-error-500">Ngưng hoạt động</span>
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-5 h-5 text-error-400"
              />
            </div>
          </template>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold">{{ data.totalDown }}</span>
            <span
              v-if="data.totalPaused > 0"
              class="text-sm text-neutral-500"
            >({{ data.totalPaused }} tạm dừng)</span>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Uptime (24 Giờ)</span>
              <UIcon
                name="i-lucide-shield-check"
                class="w-5 h-5 text-gray-400 dark:text-gray-500"
              />
            </div>
          </template>
          <div class="flex items-baseline gap-2">
            <span
              class="text-3xl font-bold"
              :class="{
                'text-success-500': data.uptimePercent24h > 99,
                'text-warning-500': data.uptimePercent24h <= 99 && data.uptimePercent24h > 95,
                'text-error-500': data.uptimePercent24h <= 95
              }"
            >
              {{ data.uptimePercent24h }}%
            </span>
            <span class="text-sm">/ {{ data.avgLatency24h }} ms</span>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
// (MỚI) Gọi API thống kê
const { data, pending, error, refresh } = await useFetch('/api/dashboard/stats', {
  lazy: true,
  default: () => ({
    totalMonitors: 0,
    totalUp: 0,
    totalDown: 0,
    totalPaused: 0,
    uptimePercent24h: 100,
    avgLatency24h: 0
  })
})
</script>
