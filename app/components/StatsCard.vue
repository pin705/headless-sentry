<template>
  <UCard
    :ui="{
      body: { padding: 'p-5' },
      ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <span
          class="text-sm font-semibold"
          :class="labelColorClass"
        >
          {{ label }}
        </span>
        <UIcon
          v-if="icon"
          :name="icon"
          :class="iconColorClass"
          class="w-5 h-5"
        />
      </div>
    </template>

    <div class="flex items-baseline gap-2">
      <span
        class="text-3xl font-bold"
        :class="valueColorClass"
      >
        {{ value }}
      </span>
      <span
        v-if="unit"
        class="text-sm text-gray-600 dark:text-gray-400"
      >
        {{ unit }}
      </span>
      <span
        v-if="subtitle"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        {{ subtitle }}
      </span>
    </div>

    <div
      v-if="description"
      class="mt-2 text-xs text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  unit?: string
  subtitle?: string
  description?: string
  icon?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const labelColorClass = computed(() => {
  const variants = {
    default: 'text-gray-700 dark:text-gray-300',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    error: 'text-error-600 dark:text-error-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  return variants[props.variant]
})

const valueColorClass = computed(() => {
  const variants = {
    default: 'text-gray-900 dark:text-gray-100',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    error: 'text-error-600 dark:text-error-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  return variants[props.variant]
})

const iconColorClass = computed(() => {
  const variants = {
    default: 'text-gray-400 dark:text-gray-500',
    success: 'text-success-500 dark:text-success-400',
    warning: 'text-warning-500 dark:text-warning-400',
    error: 'text-error-500 dark:text-error-400',
    info: 'text-blue-500 dark:text-blue-400'
  }
  return variants[props.variant]
})
</script>
