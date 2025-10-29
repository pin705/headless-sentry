<template>
  <UDashboardPanel :id="resultId">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UButton
              :to="`/monitoring/${monitorId}`"
              icon="i-heroicons-arrow-left"
              color="neutral"
              variant="ghost"
              aria-label="Quay lại Monitor"
            />
            <h1
              v-if="data?.monitor"
              class="text-xl font-bold truncate"
            >
              Kết quả kiểm tra: {{ data.monitor.name }}
            </h1>
            <h1
              v-else-if="pending"
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
        v-else-if="error || !data"
        class="p-4"
      >
        <p class="text-error-500">
          {{ error?.data?.message || 'Không thể tải chi tiết kết quả.' }}
        </p>
      </div>

      <div
        v-else
        class="p-4 space-y-4"
      >
        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Thông tin chung
            </h3>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-500 dark:text-gray-400 block">Dịch vụ:</span>
              <span>{{ data.monitor.name }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-500 dark:text-gray-400 block">Endpoint:</span>
              <span class="font-mono">{{ data.monitor.method }} {{ data.monitor.endpoint }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-500 dark:text-gray-400 block">Thời gian kiểm tra:</span>
              <span>{{ new Date(data.timestamp).toLocaleString('vi-VN') }} ({{ formatTimeAgo(new Date(data.timestamp)) }})</span>
            </div>
            <div>
              <span class="font-medium text-gray-500 dark:text-gray-400 block">Trạng thái:</span>
              <UBadge
                :color="data.isUp ? 'success' : 'error'"
                variant="soft"
              >
                {{ data.isUp ? 'UP' : 'DOWN' }}
              </UBadge>
            </div>
            <div>
              <span class="font-medium text-gray-500 dark:text-gray-400 block">Mã HTTP:</span>
              <span class="font-mono">{{ data.statusCode }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-500 dark:text-gray-400 block">Độ trễ (Latency):</span>
              <span class="font-mono">{{ data.latency }} ms</span>
            </div>
          </div>
        </UCard>

        <UCard v-if="!data.isUp && data.errorMessage">
          <template #header>
            <h3 class="font-semibold text-error-500">
              Chi tiết lỗi
            </h3>
          </template>
          <pre class="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">{{ data.errorMessage }}</pre>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const toast = useToast()
const monitorId = route.params.id as string
const resultId = route.params.resultId as string

// API Call để lấy chi tiết kết quả
const { data, pending, error, refresh } = await useFetch(
  `/api/monitors/${monitorId}/results/${resultId}`,
  { lazy: true }
)

if (error.value && error.value.statusCode !== 404) {
  toast.add({ title: 'Lỗi', description: error.value.data?.message || 'Không thể tải dữ liệu.', color: 'error' })
}

useHead({
  // Cập nhật title khi có dữ liệu
  title: computed(() => data.value ? `Kết quả: ${data.value.monitor.name}` : 'Chi tiết Kết quả')
})
</script>

<style scoped>
pre {
  white-space: pre-wrap; /* Giúp xuống dòng tự động */
  word-wrap: break-word; /* Ngắt từ nếu cần */
}
</style>
