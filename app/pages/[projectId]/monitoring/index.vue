<template>
  <UDashboardPanel id="monitoring">
    <template #header>
      <UDashboardNavbar title="Giám sát Dịch vụ">
        <template #right>
          <div class="flex items-center gap-4">
            <UButton
              :icon="pending ? 'i-heroicons-arrow-path-solid' : 'i-heroicons-arrow-path'"
              :loading="pending"
              variant="ghost"
              color="neutral"
              aria-label="Làm mới"
              @click="refresh()"
            />
            <UButton
              icon="i-heroicons-plus-solid"
              label="Thêm mới"
              color="primary"
              @click="openFormModal(null)"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="pending"
        class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-44 rounded-lg"
        />
      </div>

      <div
        v-else-if="monitors.length === 0"
        class="p-4 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 min-h-[300px]"
      >
        <UIcon
          name="i-heroicons-circle-stack-20-solid"
          class="w-12 h-12 mx-auto mb-2"
        />
        <h3 class="text-lg font-semibold">
          Chưa có dịch vụ nào
        </h3>
        <p class="text-sm">
          Hãy bắt đầu bằng cách thêm dịch vụ giám sát đầu tiên của bạn.
        </p>
        <UButton
          label="Thêm dịch vụ mới"
          icon="i-heroicons-plus"
          color="primary"
          variant="soft"
          class="mt-4"
          @click="openFormModal(null)"
        />
      </div>

      <div
        v-else
        class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard
          v-for="monitor in monitors"
          :key="monitor._id"
          :ui="{ body: { padding: 'p-4' }, ring: 'ring-1 ring-gray-200 dark:ring-gray-800', divide: 'divide-y divide-gray-200 dark:divide-gray-800' }"
        >
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-base font-semibold truncate">
                <NuxtLink
                  :to="`/${projectId}/monitoring/${monitor._id}`"
                  class="hover:underline"
                >
                  {{ monitor.name }}
                </NuxtLink>
              </span>
              <component :is="createSslIcon({ original: monitor })" />
            </div>
            <UDropdownMenu
              :items="getActionItems({ original: monitor })"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                icon="i-heroicons-ellipsis-horizontal-20-solid"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                @click.stop
              />
            </UDropdownMenu>
          </div>

          <div class="flex items-center gap-2 text-sm mt-1">
            <component :is="renderStatusBadge(monitor)" />
            <span class="text-gray-500 dark:text-gray-400 text-xs">
              {{ monitor.latestCheckedAt ? formatTimeAgo(new Date(monitor.latestCheckedAt)) : 'Chưa chạy' }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-sm mt-2 text-gray-500 dark:text-gray-400">
            <UBadge
              :label="monitor.method"
              color="neutral"
              variant="subtle"
              size="xs"
            />
            <span class="truncate font-mono text-xs">{{ monitor.endpoint }}</span>
          </div>

          <div class="text-xs text-gray-500 dark:text-gray-400 mt-3 space-y-1">
            <div
              v-if="monitor.publicPageUrl"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-heroicons-globe-alt"
                class="w-3.5 h-3.5"
              />
              <NuxtLink
                :to="monitor.publicPageUrl"
                target="_blank"
                class="hover:underline text-primary-500 dark:text-primary-400"
              >
                Trang trạng thái công khai
              </NuxtLink>
            </div>
            <div
              v-if="monitor.creator"
              class="flex items-center gap-1.5"
            >
              <UAvatar
                :src="monitor.creator.avatar || 'https://www.gravatar.com/avatar/?d=mp'"
                :alt="monitor.creator.email"
                size="3xs"
              />
              <span>Tạo bởi {{ monitor.creator.email }}</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
            <span class="text-xs text-gray-500 dark:text-gray-400">ĐỘ TRỄ (LATENCY)</span>
            <div class="text-2xl font-semibold font-mono">
              {{ monitor.latestLatency ?? '--' }} <span class="text-lg text-gray-500 dark:text-gray-400">ms</span>
            </div>
          </div>
        </UCard>
      </div>

      <UModal v-model:open="isDeleteModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold">
            Xác nhận Xóa
          </h3>
        </template>
        <template #body>
          <p>Bạn có chắc chắn muốn xóa dịch vụ <strong>{{ monitorToDelete?.original?.name }}</strong> không?</p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isDeleteModalOpen = false"
            >
              Hủy
            </UButton>
            <UButton
              color="error"
              :loading="deleteLoading"
              @click="confirmDelete"
            >
              Xóa
            </UButton>
          </div>
        </template>
      </UModal>

      <MonitorForm
        v-model="isFormModalOpen"
        :monitor="monitorToEdit"
        @saved="onFormSaved"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const toast = useToast()

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')

const route = useRoute()
const projectId = route.params.projectId as string

const apiUrl = computed(() => {
  if (!projectId) return '' // Chưa chọn project thì không fetch
  return `/api/projects/${projectId}/monitors`
})

const isFormModalOpen = ref(false)
const monitorToEdit = ref<any>(null) // Lưu trữ *monitor.original*

function openFormModal(monitorOriginal) {
  monitorToEdit.value = monitorOriginal
  isFormModalOpen.value = true
}

function onFormSaved() {
  refresh() // Tải lại bảng
}

function createSslIcon(row) {
  const ssl = row.original.ssl

  // 1. Kiểm tra không có dữ liệu
  if (!ssl || ssl.daysRemaining === null) {
    const icon = h(UIcon, {
      name: 'i-heroicons-shield-exclamation',
      class: 'text-neutral-400 dark:text-neutral-500 cursor-pointer' // Thêm cursor-pointer
    })
    return h(UTooltip, {
      text: 'Chưa kiểm tra SSL (thường chạy 1 lần/ngày)',
      popper: { placement: 'top', arrow: true, show: 'click', hide: 'click' }
    }, () => icon)
  }

  let iconName: string
  let colorClass: string
  let tooltipText: string

  // 2. Xử lý Lỗi
  if (!ssl.isValid || ssl.daysRemaining < 0) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-error-500' // (Rule 7)
    tooltipText = ssl.errorMessage
      ? `Lỗi: ${ssl.errorMessage}`
      : `SSL đã hết hạn ${Math.abs(ssl.daysRemaining)} ngày trước!`
  }
  // 3. Xử lý Cảnh báo
  else if (ssl.daysRemaining < 14) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-warning-500' // (Rule 7)
    tooltipText = `SSL sẽ hết hạn sau ${ssl.daysRemaining} ngày (vào ${new Date(ssl.expiresAt).toLocaleDateString('vi-VN')}).`
  }
  // 4. Xử lý Tốt
  else {
    iconName = 'i-heroicons-shield-check-solid'
    colorClass = 'text-success-500' // (Rule 7)
    tooltipText = `SSL hợp lệ. Còn ${ssl.daysRemaining} ngày (hết hạn ${new Date(ssl.expiresAt).toLocaleDateString('vi-VN')}).`
  }

  const icon = h(UIcon, {
    name: iconName,
    class: `${colorClass} cursor-pointer` // Thêm cursor-pointer
  })
  return h(UTooltip, {
    text: tooltipText,
    popper: { placement: 'top', arrow: true, show: 'click', hide: 'click' }
  }, () => icon)
}

const historyColumns = [
  { accessorKey: 'latestStatus', header: 'Trạng thái', class: 'w-24',
    cell: ({ row }) => {
      const { color, label } = getStatusAppearance(row.original)
      return h(UBadge, { color: color, variant: 'soft', class: 'w-20 justify-center' }, () => label)
    }
  },
  {
    accessorKey: 'name',
    header: 'Dịch vụ',
    cell: ({ row }) => {
      const monitor = row.original
      const sslIcon = createSslIcon(row)
      const nameText = h('span', { class: 'font-medium text-base' }, monitor.name || 'Chưa đặt tên')
      const endpointBadge = h(UBadge, { label: monitor.method, color: 'neutral', variant: 'subtle', size: 'xs' })
      const endpointText = h('span', { class: 'truncate max-w-sm' }, monitor.endpoint)
      const endpointDiv = h('span', { class: 'text-gray-500 dark:text-gray-400 text-sm font-mono flex items-center gap-1.5' }, [endpointBadge, endpointText])
      const nameDiv = h('div', { class: 'flex items-center gap-1.5' }, [nameText, sslIcon])
      return h('div', { class: 'flex flex-col py-1' }, [nameDiv, endpointDiv])
    }
  },
  { accessorKey: 'latestLatency', header: 'Độ trễ', class: 'w-24',
    cell: ({ row }) => row.original.latestLatency !== undefined
      ? h('span', { class: 'font-mono text-sm' }, `${row.original.latestLatency} ms`)
      : h('span', { class: 'text-gray-400' }, '--')
  },
  { accessorKey: 'latestCheckedAt', header: 'Kiểm tra cuối', class: 'w-32',
    cell: ({ row }) => row.original.latestCheckedAt
      ? h('span', { class: 'text-sm' }, formatTimeAgo(new Date(row.original.latestCheckedAt)))
      : h('span', { class: 'text-gray-400' }, 'Chưa chạy')
  },
  { accessorKey: 'actions', header: '', class: 'w-10 text-right',
    cell: ({ row }) => h(UDropdownMenu,
      { items: getActionItems(row), content: { align: 'end' } },
      () => h(UButton, { icon: 'i-heroicons-ellipsis-horizontal-20-solid', color: 'neutral', variant: 'ghost' })
    )
  }
]

function renderStatusBadge(monitor: any) {
  const { color, label } = getStatusAppearance(monitor)
  return h(UBadge, { color: color, variant: 'soft' }, () => label)
}

// Modal Xóa
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const monitorToDelete = ref<any>(null)

const { data: monitors, pending, error, refresh } = await useFetch(apiUrl.value, {
  lazy: true,
  default: () => []
})

if (error.value) {
  toast.add({ title: 'Lỗi', description: 'Không thể tải danh sách giám sát.', color: 'error' })
}

const getActionItems = (row): DropdownMenuItem[][] => [
  [{
    label: 'Xem chi tiết',
    icon: 'i-heroicons-chart-bar-20-solid',
    onSelect: () => navigateTo(`/${projectId}/monitoring/${row.original._id}`)
  }, {
    label: 'Cập nhật',
    icon: 'i-heroicons-pencil-square-20-solid',
    onSelect: () => openFormModal(row.original) // (MỚI)
  }, {
    label: row.original.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt',
    icon: row.original.status === 'ACTIVE' ? 'i-heroicons-pause-circle-20-solid' : 'i-heroicons-play-circle-20-solid',
    onSelect: () => toggleStatus(row.original._id)
  }],
  [{
    label: 'Xóa',
    icon: 'i-heroicons-trash-20-solid',
    labelClass: 'text-error-500 dark:text-error-400',
    onSelect: () => openDeleteModal(row)
  }]
]

// Hàm Tạm dừng / Kích hoạt
async function toggleStatus(id: string) {
  try {
    await $fetch(`${apiUrl.value}${id}`, { method: 'PATCH' })
    toast.add({ title: 'Thành công', description: 'Đã cập nhật trạng thái.' })
    refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể cập nhật.', color: 'error' })
  }
}

// Hàm mở Modal Xóa
function openDeleteModal(row) {
  monitorToDelete.value = row
  isDeleteModalOpen.value = true
}

// Hàm xác nhận Xóa
async function confirmDelete() {
  if (!monitorToDelete.value) return
  deleteLoading.value = true
  try {
    await $fetch(`${apiUrl.value}/${monitorToDelete.value.original._id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xóa', description: `Đã xóa ${monitorToDelete.value.original.name}.` })
    isDeleteModalOpen.value = false
    monitorToDelete.value = null
    refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể xóa.', color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}
</script>
