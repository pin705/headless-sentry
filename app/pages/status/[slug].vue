<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
    <div class="max-w-3xl mx-auto">
      <header class="mb-8 text-center">
        <img
          v-if="data?.config?.logoUrl"
          :src="data.config.logoUrl"
          alt="Logo"
          class="h-12 mx-auto mb-4"
        >
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {{ data?.config?.title || 'Trạng thái Dịch vụ' }}
        </h1>
        <p
          v-if="overallStatus"
          class="mt-2 text-lg"
          :class="overallStatus.colorClass"
        >
          <UIcon
            :name="overallStatus.icon"
            class="w-5 h-5 mr-1 align-middle"
          />
          {{ overallStatus.text }}
        </p>
        <p
          v-if="lastUpdated"
          class="text-xs text-gray-500 dark:text-gray-400 mt-1"
        >
          Cập nhật lần cuối: {{ lastUpdated }}
        </p>
      </header>

      <div
        v-if="pending"
        class="text-center py-10"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-gray-500 w-8 h-8"
        />
      </div>
      <div
        v-else-if="error"
        class="text-center py-10"
      >
        <p class="text-error-500">
          {{ error.data?.message || 'Không thể tải trang trạng thái.' }}
        </p>
      </div>

      <div
        v-else-if="data?.monitors"
        class="space-y-3"
      >
        <UCard
          v-for="monitor in data.monitors"
          :key="monitor._id"
          class="shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-800 dark:text-gray-100">{{ monitor.name }}</span>
            <UBadge
              :color="statusMap[monitor.currentStatus]?.color || 'gray'"
              variant="soft"
              size="lg"
            >
              <UIcon
                :name="statusMap[monitor.currentStatus]?.icon || 'i-heroicons-question-mark-circle'"
                class="w-4 h-4 mr-1"
              />
              {{ statusMap[monitor.currentStatus]?.label || 'Không rõ' }}
            </UBadge>
          </div>
        </UCard>
      </div>
    </div>

    <footer class="mt-12 text-center text-xs text-gray-400">
      Cung cấp bởi <a
        href="/"
        target="_blank"
        class="hover:underline text-primary-500"
      >Headless Sentry</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// (Mới) Định nghĩa map trạng thái
const statusMap: Record<string, { label: string, color: string, icon: string }> = {
  OPERATIONAL: { label: 'Hoạt động', color: 'success', icon: 'i-heroicons-check-circle-solid' },
  OUTAGE: { label: 'Gián đoạn', color: 'error', icon: 'i-heroicons-exclamation-triangle-solid' },
  MAINTENANCE: { label: 'Bảo trì', color: 'warning', icon: 'i-heroicons-wrench-solid' },
  UNKNOWN: { label: 'Không rõ', color: 'neutral', icon: 'i-heroicons-question-mark-circle-solid' }
}

const route = useRoute()
const slug = route.params.slug as string

// API Call công khai
const { data, pending, error } = await useFetch(`/api/public/status/${slug}`, {
  lazy: true,
  default: () => ({ config: null, monitors: [] })
})

// Dynamic SEO based on status page data
watchEffect(() => {
  if (data.value?.config) {
    const title = `${data.value.config.title || 'Trạng thái Dịch vụ'} - Status Page`
    const description = `Xem trạng thái hoạt động của ${data.value.config.title || 'dịch vụ'} theo thời gian thực. Kiểm tra uptime và hiệu năng của các dịch vụ.`
    
    useHead({
      title,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'robots', content: 'index, follow' } // Public page
      ]
    })
  }
})

// (Mới) Tính toán trạng thái tổng thể
const overallStatus = computed(() => {
  if (!data.value?.monitors || data.value.monitors.length === 0) return null

  const monitors = data.value.monitors
  const hasOutage = monitors.some(m => m.currentStatus === 'OUTAGE')
  const hasMaintenance = monitors.some(m => m.currentStatus === 'MAINTENANCE')

  if (hasOutage) return { text: 'Một số dịch vụ đang gặp sự cố.', colorClass: 'text-error-500', icon: statusMap.OUTAGE.icon }
  if (hasMaintenance) return { text: 'Một số dịch vụ đang bảo trì.', colorClass: 'text-warning-500', icon: statusMap.MAINTENANCE.icon }
  return { text: 'Tất cả dịch vụ đang hoạt động.', colorClass: 'text-success-500', icon: statusMap.OPERATIONAL.icon }
})

// (Mới) Thời gian cập nhật cuối (dựa vào monitor mới nhất)
const lastUpdated = computed(() => {
  // Cần lấy timestamp mới nhất từ API /results hoặc /monitors
  // Hiện tại chỉ là placeholder
  return data.value?.monitors?.length > 0 ? formatTimeAgo(new Date()) : null
})

// Dùng layout trống
definePageMeta({
  layout: false // Quan trọng: Không dùng layout mặc định có sidebar
})

useHead({
  // Cập nhật title khi có dữ liệu
  title: computed(() => data.value?.config?.title || (pending.value ? 'Đang tải...' : 'Trang Trạng thái'))
  // (Tùy chọn) Thêm link favicon từ config
  // link: computed(() => data.value?.config?.logoUrl ? [{ rel: 'icon', href: data.value.config.logoUrl }] : []),
})
</script>
