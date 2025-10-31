<template>
  <UCard
    :ui="{
      body: { padding: 'p-4 sm:p-5' },
      ring: 'ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700',
      divide: 'divide-y divide-gray-200 dark:divide-gray-800'
    }"
    class="transition-all duration-200"
  >
    <div class="flex justify-between items-start mb-3">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <NuxtLink
          :to="`/${projectId}/monitoring/${monitor._id}`"
          class="text-base font-semibold truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {{ monitor.name }}
        </NuxtLink>
        <UTooltip
          v-if="monitor.sslExpiry"
          :text="getSSLTooltipText(monitor.sslExpiry)"
        >
          <UIcon
            :name="getSSLIcon(monitor.sslExpiry)"
            :class="getSSLIconClass(monitor.sslExpiry)"
            class="w-4 h-4"
          />
        </UTooltip>
      </div>
      <slot name="actions" />
    </div>

    <div class="flex items-center gap-2 mb-3">
      <UBadge
        :label="getStatusLabel(monitor)"
        :color="getStatusColor(monitor)"
        variant="subtle"
        size="sm"
      />
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ formatTimeAgo(monitor.updatedAt) }}
      </span>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Uptime (24h)</span>
        <span
          class="font-semibold"
          :class="getUptimeColorClass(monitor.stats?.uptime24h || 100)"
        >
          {{ (monitor.stats?.uptime24h || 100).toFixed(2) }}%
        </span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Avg Latency</span>
        <span class="font-semibold text-gray-900 dark:text-gray-100">
          {{ monitor.stats?.avgLatency || 0 }} ms
        </span>
      </div>
      <div
        v-if="monitor.endpoint"
        class="pt-2 border-t border-gray-100 dark:border-gray-800"
      >
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ monitor.endpoint }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Monitor {
  _id: string
  name: string
  endpoint?: string
  status: string
  isPaused?: boolean
  sslExpiry?: Date
  updatedAt: Date
  stats?: {
    uptime24h?: number
    avgLatency?: number
  }
}

interface Props {
  monitor: Monitor
  projectId: string
}

defineProps<Props>()

function getStatusLabel(monitor: Monitor): string {
  if (monitor.isPaused) return 'Paused'
  return monitor.status === 'up' ? 'Up' : 'Down'
}

function getStatusColor(monitor: Monitor): string {
  if (monitor.isPaused) return 'gray'
  return monitor.status === 'up' ? 'success' : 'error'
}

function getUptimeColorClass(uptime: number): string {
  if (uptime >= 99.9) return 'text-success-600 dark:text-success-400'
  if (uptime >= 99) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function getSSLIcon(expiry?: Date): string {
  if (!expiry) return 'i-lucide-shield-off'
  const daysUntilExpiry = Math.floor((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntilExpiry < 0) return 'i-lucide-shield-alert'
  if (daysUntilExpiry < 30) return 'i-lucide-shield-alert'
  return 'i-lucide-shield-check'
}

function getSSLIconClass(expiry?: Date): string {
  if (!expiry) return 'text-gray-400 dark:text-gray-500'
  const daysUntilExpiry = Math.floor((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntilExpiry < 0) return 'text-error-500 dark:text-error-400'
  if (daysUntilExpiry < 30) return 'text-warning-500 dark:text-warning-400'
  return 'text-success-500 dark:text-success-400'
}

function getSSLTooltipText(expiry?: Date): string {
  if (!expiry) return 'SSL not checked'
  const daysUntilExpiry = Math.floor((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntilExpiry < 0) return 'SSL certificate expired'
  if (daysUntilExpiry < 30) return `SSL expires in ${daysUntilExpiry} days`
  return `SSL expires in ${daysUntilExpiry} days`
}
</script>
