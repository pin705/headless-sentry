<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-8 text-center">
        <img
          v-if="data?.config?.logoUrl"
          :src="data.config.logoUrl"
          alt="Logo"
          class="h-12 mx-auto mb-4"
        >
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {{ data?.config?.title || t('status.title') }}
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
          {{ t('status.lastUpdated') }}: {{ lastUpdated }}
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
          {{ error.data?.message || t('status.error') }}
        </p>
      </div>

      <div
        v-else-if="data?.monitors"
        class="space-y-6"
      >
        <!-- Monitor Status Cards -->
        <div class="space-y-3">
          <UCard
            v-for="monitor in data.monitors"
            :key="monitor._id"
            class="shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <span class="font-medium text-gray-800 dark:text-gray-100">{{ monitor.name }}</span>
              </div>
              <UBadge
                :color="statusMap[monitor.currentStatus]?.color || 'gray'"
                variant="soft"
                size="lg"
              >
                <UIcon
                  :name="statusMap[monitor.currentStatus]?.icon || 'i-heroicons-question-mark-circle'"
                  class="w-4 h-4 mr-1"
                />
                {{ statusMap[monitor.currentStatus]?.label || t('status.status.unknown') }}
              </UBadge>
            </div>
          </UCard>
        </div>

        <!-- Additional Information Section -->
        <div
          v-if="data.monitors.length > 0"
          class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {{ t('status.uptimeStats') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UCard class="shadow-sm">
              <div class="text-center">
                <div class="text-2xl font-bold text-success-500">
                  {{ calculateOperationalPercentage(data.monitors) }}%
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ t('status.status.operational') }}
                </div>
              </div>
            </UCard>
            <UCard class="shadow-sm">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary-500">
                  {{ operationalCount }}/{{ data.monitors.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ t('status.status.operational') }}
                </div>
              </div>
            </UCard>
            <UCard class="shadow-sm">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {{ data.monitors.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ t('project.monitoring') }}
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>

    <footer class="mt-12 text-center text-xs text-gray-400">
      {{ t('status.poweredBy') }} <a
        href="/"
        target="_blank"
        class="hover:underline text-primary-500"
      >Headless Sentry</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const { t } = useI18n()

// Use the composable for status page logic
const {
  data,
  pending,
  error,
  statusMap,
  overallStatus,
  lastUpdated,
  pageTitle
} = useStatusPage(slug)

// Calculate operational count
const operationalCount = computed(() => {
  if (!data.value?.monitors) return 0
  return data.value.monitors.filter(m => m.currentStatus === 'OPERATIONAL').length
})

// Calculate current operational percentage (not historical uptime)
const calculateOperationalPercentage = (monitors: typeof data.value.monitors) => {
  if (!monitors || monitors.length === 0) return 100
  const operational = monitors.filter(m => m.currentStatus === 'OPERATIONAL').length
  return ((operational / monitors.length) * 100).toFixed(1)
}

// Dynamic SEO based on status page data
watchEffect(() => {
  if (data.value?.config) {
    const title = `${data.value.config.title || t('status.title')} - Status Page`
    const description = `${t('status.title')} - ${data.value.config.title || t('common.appName')}`

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
        { name: 'robots', content: 'index, follow' }
      ]
    })
  }
})

// Use empty layout
definePageMeta({
  layout: false
})

useHead({
  title: computed(() => pageTitle.value)
})
</script>
