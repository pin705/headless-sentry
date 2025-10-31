<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          {{ title }}
        </h3>
        <slot name="actions" />
      </div>
    </template>

    <UTable
      :data="data"
      :columns="columns"
      :empty-state="{
        icon: emptyIcon,
        label: emptyMessage
      }"
      :ui="{
        td: { padding: 'py-3 px-4' },
        th: { padding: 'py-3 px-4' }
      }"
    />
  </UCard>
</template>

<script setup lang="ts">
interface Column {
  accessorKey: string
  header: string
  class?: string
  cell?: (context: { row: { original: Record<string, unknown> } }) => unknown
}

interface Props {
  data: Record<string, unknown>[]
  columns: Column[]
  title?: string
  emptyMessage?: string
  emptyIcon?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Alerts',
  emptyMessage: 'No alerts found',
  emptyIcon: 'i-lucide-bell-off'
})
</script>
