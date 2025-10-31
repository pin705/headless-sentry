<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ t('payment.history') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              {{ t('payment.historyDescription') }}
            </p>
          </div>
          <UButton
            :label="t('common.back')"
            icon="i-lucide-arrow-left"
            variant="outline"
            @click="$router.back()"
          />
        </div>

        <!-- Balance Card -->
        <UCard class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('payment.currentBalance') }}
              </p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(user?.balance || 0) }}
              </p>
            </div>
            <UIcon
              name="i-lucide-wallet"
              class="w-12 h-12 text-primary-500"
            />
          </div>
        </UCard>
      </div>

      <!-- Transactions Table -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ t('payment.history') }}
            </h3>
            <div class="flex items-center gap-2">
              <USelect
                v-model="selectedFilter"
                :options="filterOptions"
                size="sm"
              />
            </div>
          </div>
        </template>

        <!-- Loading State -->
        <div
          v-if="pending"
          class="text-center py-12"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 animate-spin text-primary-500 mx-auto"
          />
          <p class="text-gray-600 dark:text-gray-400 mt-4">
            {{ t('common.loading') }}
          </p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!transactions.length"
          class="text-center py-12"
        >
          <UIcon
            name="i-lucide-receipt"
            class="w-16 h-16 text-gray-400 mx-auto mb-4"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ t('payment.noTransactions') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {{ t('payment.noTransactionsDesc') }}
          </p>
          <UButton
            :label="t('pricing.upgradeTo', { plan: 'Pro' })"
            color="primary"
            class="mt-6"
            @click="$router.push('/pricing')"
          />
        </div>

        <!-- Transactions List -->
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('payment.date') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('payment.type') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('payment.method') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('payment.amount') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('payment.status') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ t('payment.note') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="transaction in filteredTransactions"
                :key="transaction._id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(transaction.createdAt) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge
                    :label="t(`payment.types.${transaction.type}`)"
                    :color="getTypeColor(transaction.type)"
                    size="sm"
                  />
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {{ t(`payment.methods.${transaction.method}`) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                  <span :class="getAmountClass(transaction.type)">
                    {{ formatAmount(transaction.amount, transaction.type) }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge
                    :label="t(`payment.statuses.${transaction.status}`)"
                    :color="getStatusColor(transaction.status)"
                    size="sm"
                  />
                </td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {{ transaction.note || '-' }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div
            v-if="pagination.totalPages > 1"
            class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-800"
          >
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('common.showing') }} {{ (pagination.page - 1) * pagination.limit + 1 }}
              - {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
              {{ t('common.of') }} {{ pagination.total }}
            </div>
            <div class="flex gap-2">
              <UButton
                :label="t('common.previous')"
                size="sm"
                variant="outline"
                :disabled="pagination.page === 1"
                @click="previousPage"
              />
              <UButton
                :label="t('common.next')"
                size="sm"
                variant="outline"
                :disabled="!pagination.hasMore"
                @click="nextPage"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

const { t } = useI18n()
const { user } = useUserSession()
const route = useRoute()

// Pagination state
const currentPage = ref(1)

// Fetch transactions
const { data, pending, refresh } = await useFetch('/api/user/transactions', {
  query: {
    page: currentPage,
    limit: 20
  }
})

const transactions = computed(() => data.value?.data?.transactions || [])
const pagination = computed(() => data.value?.data?.pagination || {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasMore: false
})

// Filter
const selectedFilter = ref('all')
const filterOptions = [
  { label: t('common.all'), value: 'all' },
  { label: t('payment.types.deposit'), value: 'deposit' },
  { label: t('payment.types.plan_upgrade'), value: 'plan_upgrade' },
  { label: t('payment.types.plan_renewal'), value: 'plan_renewal' },
  { label: t('payment.types.refund'), value: 'refund' }
]

const filteredTransactions = computed(() => {
  if (selectedFilter.value === 'all') {
    return transactions.value
  }
  return transactions.value.filter((t: any) => t.type === selectedFilter.value)
})

// Pagination functions
function nextPage() {
  if (pagination.value.hasMore) {
    currentPage.value++
    refresh()
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    refresh()
  }
}

// Formatting functions
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

function formatAmount(amount: number, type: string) {
  const prefix = type === 'deposit' || type === 'refund' ? '+' : '-'
  return prefix + formatCurrency(Math.abs(amount))
}

function getAmountClass(type: string) {
  return type === 'deposit' || type === 'refund'
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    deposit: 'green',
    plan_upgrade: 'blue',
    plan_renewal: 'primary',
    refund: 'amber'
  }
  return colors[type] || 'neutral'
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    completed: 'green',
    pending: 'amber',
    failed: 'red',
    refunded: 'neutral'
  }
  return colors[status] || 'neutral'
}

useHead({
  title: t('payment.history') + ' - Headless Sentry'
})
</script>
