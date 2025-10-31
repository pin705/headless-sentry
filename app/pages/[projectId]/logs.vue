<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ t('logs.title') }}</h1>
      <UButton
        icon="i-lucide-refresh-cw"
        :label="t('common.refresh')"
        @click="refreshLogs"
      />
    </div>

    <!-- Filters -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          :placeholder="t('logs.searchPlaceholder')"
          @keyup.enter="applyFilters"
        />
        <USelect
          v-model="selectedLevel"
          :options="logLevels"
          :placeholder="t('logs.selectLevel')"
          @change="applyFilters"
        />
        <USelect
          v-model="selectedSource"
          :options="logSources"
          :placeholder="t('logs.selectSource')"
          @change="applyFilters"
        />
        <UButton
          :label="t('logs.applyFilters')"
          color="primary"
          block
          @click="applyFilters"
        />
      </div>
    </UCard>

    <!-- Log Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <UCard v-for="level in ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']" :key="level">
        <div class="text-center">
          <div class="text-2xl font-bold" :class="getLevelColor(level)">
            {{ stats[level] || 0 }}
          </div>
          <div class="text-sm text-gray-500">{{ level }}</div>
        </div>
      </UCard>
    </div>

    <!-- Logs Table -->
    <UCard>
      <UTable
        :loading="loading"
        :rows="logs"
        :columns="columns"
      >
        <template #timestamp-data="{ row }">
          <span class="text-sm text-gray-600">
            {{ formatDateTime(row.timestamp) }}
          </span>
        </template>

        <template #level-data="{ row }">
          <UBadge :color="getLevelBadgeColor(row.level)">
            {{ row.level }}
          </UBadge>
        </template>

        <template #message-data="{ row }">
          <div class="max-w-md truncate" :title="row.message">
            {{ row.message }}
          </div>
        </template>

        <template #source-data="{ row }">
          <span class="text-sm">{{ row.source }}</span>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-lucide-eye"
            size="xs"
            color="gray"
            variant="ghost"
            @click="viewLogDetail(row)"
          />
        </template>
      </UTable>

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-600">
          {{ t('logs.showing', { from: (pagination.page - 1) * pagination.limit + 1, to: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total }) }}
        </div>
        <UPagination
          v-model="pagination.page"
          :total="pagination.total"
          :page-count="pagination.limit"
          @update:model-value="fetchLogs"
        />
      </div>
    </UCard>

    <!-- Log Detail Modal -->
    <UModal v-model="isDetailModalOpen">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold">{{ t('logs.logDetail') }}</h3>
            <UButton
              icon="i-lucide-x"
              color="gray"
              variant="ghost"
              @click="isDetailModalOpen = false"
            />
          </div>
        </template>

        <div v-if="selectedLog" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">{{ t('logs.timestamp') }}</label>
            <div class="mt-1">{{ formatDateTime(selectedLog.timestamp) }}</div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">{{ t('logs.level') }}</label>
            <div class="mt-1">
              <UBadge :color="getLevelBadgeColor(selectedLog.level)">
                {{ selectedLog.level }}
              </UBadge>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">{{ t('logs.message') }}</label>
            <div class="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap break-words">
              {{ selectedLog.message }}
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">{{ t('logs.source') }}</label>
            <div class="mt-1">{{ selectedLog.source }}</div>
          </div>

          <div v-if="selectedLog.tags && selectedLog.tags.length">
            <label class="text-sm font-medium text-gray-700">{{ t('logs.tags') }}</label>
            <div class="mt-1 flex gap-2 flex-wrap">
              <UBadge v-for="tag in selectedLog.tags" :key="tag" color="gray">{{ tag }}</UBadge>
            </div>
          </div>

          <div v-if="selectedLog.metadata && Object.keys(selectedLog.metadata).length">
            <label class="text-sm font-medium text-gray-700">{{ t('logs.metadata') }}</label>
            <div class="mt-1 p-3 bg-gray-50 rounded-md">
              <pre class="text-xs overflow-auto">{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

const { t } = useI18n()
const route = useRoute()
const projectId = route.params.projectId as string

// State
const loading = ref(false)
const logs = ref<any[]>([])
const stats = ref<Record<string, number>>({})
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
})

const searchQuery = ref('')
const selectedLevel = ref<string | null>(null)
const selectedSource = ref<string | null>(null)

const isDetailModalOpen = ref(false)
const selectedLog = ref<any>(null)

// Options
const logLevels = [
  { value: null, label: t('logs.allLevels') },
  { value: 'DEBUG', label: 'DEBUG' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARN', label: 'WARN' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'FATAL', label: 'FATAL' }
]

const logSources = [
  { value: null, label: t('logs.allSources') },
  { value: 'application', label: t('logs.application') },
  { value: 'system', label: t('logs.system') },
  { value: 'agent', label: t('logs.agent') }
]

const columns = [
  { key: 'timestamp', label: t('logs.timestamp') },
  { key: 'level', label: t('logs.level') },
  { key: 'message', label: t('logs.message') },
  { key: 'source', label: t('logs.source') },
  { key: 'actions', label: '' }
]

// Fetch logs
async function fetchLogs() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (searchQuery.value) params.search = searchQuery.value
    if (selectedLevel.value) params.level = selectedLevel.value
    if (selectedSource.value) params.source = selectedSource.value

    const response = await $fetch(`/api/projects/${projectId}/logs`, { params })

    if (response.success) {
      logs.value = response.data.logs
      pagination.value = response.data.pagination
      stats.value = response.data.stats
    }
  } catch (error) {
    console.error('Error fetching logs:', error)
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  pagination.value.page = 1
  fetchLogs()
}

function refreshLogs() {
  fetchLogs()
}

function viewLogDetail(log: any) {
  selectedLog.value = log
  isDetailModalOpen.value = true
}

function formatDateTime(date: string | Date) {
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
}

function getLevelColor(level: string) {
  const colors: Record<string, string> = {
    DEBUG: 'text-gray-600',
    INFO: 'text-blue-600',
    WARN: 'text-yellow-600',
    ERROR: 'text-red-600',
    FATAL: 'text-red-800'
  }
  return colors[level] || 'text-gray-600'
}

function getLevelBadgeColor(level: string) {
  const colors: Record<string, string> = {
    DEBUG: 'gray',
    INFO: 'blue',
    WARN: 'yellow',
    ERROR: 'red',
    FATAL: 'red'
  }
  return colors[level] || 'gray'
}

// Initial fetch
onMounted(() => {
  fetchLogs()
})
</script>
