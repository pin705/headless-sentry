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

    <div
      v-if="!hasData"
      class="h-64 flex items-center justify-center"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-line-chart"
          class="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600"
        />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ emptyMessage }}
        </p>
      </div>
    </div>

    <VisXYContainer
      v-else
      :data="chartData"
      :x="xAccessor"
      :y="yAccessor"
      class="h-64"
    >
      <VisLine
        :x="xAccessor"
        :y="yAccessor"
        color="rgb(59, 130, 246)"
        :curve-type="curveType"
      />
      <VisAxis
        type="x"
        :tick-format="formatXTick"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :tick-format="formatYTick"
      />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisTooltip } from '@unovis/vue'

interface DataPoint {
  hour: string
  avgLatency: number
}

interface Props {
  data: DataPoint[]
  title?: string
  emptyMessage?: string
  curveType?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Latency Chart',
  emptyMessage: 'No data available',
  curveType: 'basis'
})

const hasData = computed(() => props.data && props.data.length > 1)

const chartData = computed(() => {
  return props.data.map(item => ({
    hour: item.hour,
    avgLatency: item.avgLatency
  }))
})

const xAccessor = (d: DataPoint) => new Date(d.hour)
const yAccessor = (d: DataPoint) => d.avgLatency

const formatXTick = (value: number | Date) => {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const formatYTick = (value: number) => `${value} ms`
</script>
