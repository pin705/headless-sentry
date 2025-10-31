<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          SSL Status
        </span>
        <UIcon
          :name="iconName"
          :class="iconColorClass"
          class="w-5 h-5"
        />
      </div>
    </template>

    <div class="space-y-2">
      <div class="flex items-baseline gap-2">
        <span
          class="text-3xl font-bold"
          :class="statusColorClass"
        >
          {{ daysRemaining }}
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          days
        </span>
      </div>

      <div
        v-if="expiryDate"
        class="text-xs text-gray-500 dark:text-gray-400"
      >
        Expires: {{ formatDate(expiryDate) }}
      </div>

      <UBadge
        :label="statusLabel"
        :color="badgeColor"
        variant="subtle"
        size="sm"
        class="mt-2"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  expiryDate?: Date | string | null
  checkEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  checkEnabled: true
})

const daysRemaining = computed(() => {
  if (!props.expiryDate) return 'N/A'
  const days = Math.floor((new Date(props.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
})

const statusLabel = computed(() => {
  if (!props.expiryDate) return 'Not checked'
  const days = typeof daysRemaining.value === 'number' ? daysRemaining.value : 0
  if (days <= 0) return 'Expired'
  if (days < 30) return 'Expiring soon'
  return 'Valid'
})

const statusColorClass = computed(() => {
  if (!props.expiryDate) return 'text-gray-500 dark:text-gray-400'
  const days = typeof daysRemaining.value === 'number' ? daysRemaining.value : 0
  if (days <= 0) return 'text-error-600 dark:text-error-400'
  if (days < 30) return 'text-warning-600 dark:text-warning-400'
  return 'text-success-600 dark:text-success-400'
})

const badgeColor = computed(() => {
  if (!props.expiryDate) return 'gray'
  const days = typeof daysRemaining.value === 'number' ? daysRemaining.value : 0
  if (days <= 0) return 'error'
  if (days < 30) return 'warning'
  return 'success'
})

const iconName = computed(() => {
  if (!props.expiryDate) return 'i-lucide-shield-off'
  const days = typeof daysRemaining.value === 'number' ? daysRemaining.value : 0
  if (days <= 0) return 'i-lucide-shield-alert'
  if (days < 30) return 'i-lucide-shield-alert'
  return 'i-lucide-shield-check'
})

const iconColorClass = computed(() => {
  if (!props.expiryDate) return 'text-gray-400 dark:text-gray-500'
  const days = typeof daysRemaining.value === 'number' ? daysRemaining.value : 0
  if (days <= 0) return 'text-error-500 dark:text-error-400'
  if (days < 30) return 'text-warning-500 dark:text-warning-400'
  return 'text-success-500 dark:text-success-400'
})

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
