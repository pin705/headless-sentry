<template>
  <UDashboardPanel id="api-monitoring">
    <template #header>
      <UDashboardNavbar title="Giám sát Dịch vụ">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
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
      <UCard
        class="m-4"
        :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: 'p-0 sm:p-0' } }"
      >
        <UTable
          :data="monitors"
          :columns="historyColumns"
          :loading="pending"
          :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Chưa có dịch vụ nào được giám sát.' }"
        />
      </UCard>

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

// === Logic Bảng (Tuân thủ 7 Rules) ===
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

// (MỚI) State cho Modal Form
const isFormModalOpen = ref(false)
const monitorToEdit = ref<any>(null) // Lưu trữ *monitor.original*

// (MỚI) Hàm mở Modal (chỉ set data)
function openFormModal(monitorOriginal: any | null) {
  monitorToEdit.value = monitorOriginal
  isFormModalOpen.value = true
}

// (MỚI) Hàm callback khi Form lưu thành công
function onFormSaved() {
  refresh() // Tải lại bảng
}

// (MỚI) Hàm helper tạo icon SSL (Trigger bằng Click)
function createSslIcon(row: any) {
  // (Tuân thủ Rule 3)
  const ssl = row.original.ssl

  // 1. Kiểm tra không có dữ liệu
  if (!ssl || ssl.daysRemaining === null) {
    const icon = h(UIcon, {
      name: 'i-heroicons-shield-exclamation',
      // (Tuân thủ Rule 7)
      class: 'text-neutral-400 dark:text-neutral-500 cursor-pointer' // Thêm cursor-pointer
    })
    return h(UTooltip, {
      text: 'Chưa kiểm tra SSL (thường chạy 1 lần/ngày)',
      // (MỚI) Thêm trigger click
      popper: { placement: 'top', arrow: true, show: 'click', hide: 'click' }
    }, () => icon)
  }

  let iconName: string
  let colorClass: string // (Tuân thủ Rule 7)
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

  // 5. Tạo vnode
  const icon = h(UIcon, {
    name: iconName,
    class: `${colorClass} cursor-pointer` // Thêm cursor-pointer
  })
  return h(UTooltip, {
    text: tooltipText,
    // (MỚI) Thêm trigger click
    popper: { placement: 'top', arrow: true, show: 'click', hide: 'click' }
  }, () => icon)
}

// (Tuân thủ Rule 5)
const historyColumns = [
  { accessorKey: 'latestStatus', header: 'Trạng thái', class: 'w-24',
    cell: ({ row }: any) => {
      const { color, label } = getStatusAppearance(row.original.status)
      return h(UBadge, { color: color, variant: 'soft', class: 'w-20 justify-center' }, () => label)
    }
  },
  {
    accessorKey: 'name',
    header: 'Dịch vụ',
    cell: ({ row }: any) => {
      const monitor = row.original
      const sslIcon = createSslIcon(row)
      const nameText = h('span', { class: 'font-medium text-base' }, monitor.name)
      const endpointBadge = h(UBadge, { label: monitor.method, color: 'neutral', variant: 'subtle', size: 'xs' })
      const endpointText = h('span', { class: 'truncate max-w-sm' }, monitor.endpoint)
      const endpointDiv = h('span', { class: 'text-gray-500 dark:text-gray-400 text-sm font-mono flex items-center gap-1.5' }, [endpointBadge, endpointText])
      const nameDiv = h('div', { class: 'flex items-center gap-1.5' }, [nameText, sslIcon])
      return h('div', { class: 'flex flex-col py-1' }, [nameDiv, endpointDiv])
    }
  },
  { accessorKey: 'latestLatency', header: 'Độ trễ', class: 'w-24',
    cell: ({ row }: any) => row.original.latestLatency !== undefined
      ? h('span', { class: 'font-mono text-sm' }, `${row.original.latestLatency} ms`)
      : h('span', { class: 'text-gray-400' }, '--')
  },
  { accessorKey: 'latestCheckedAt', header: 'Kiểm tra cuối', class: 'w-32',
    cell: ({ row }: any) => row.original.latestCheckedAt
      ? h('span', { class: 'text-sm' }, formatTimeAgo(new Date(row.original.latestCheckedAt)))
      : h('span', { class: 'text-gray-400' }, 'Chưa chạy')
  },
  { accessorKey: 'actions', header: '', class: 'w-10 text-right',
    cell: ({ row }: any) => h(UDropdownMenu,
      { items: getActionItems(row), content: { align: 'end' } },
      () => h(UButton, { icon: 'i-heroicons-ellipsis-horizontal-20-solid', color: 'neutral', variant: 'ghost' })
    )
  }
]

// Modal Xóa
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const monitorToDelete = ref<any>(null)

// (Tuân thủ Rule 6)
const { data: monitors, pending, error, refresh } = await useFetch('/api/monitors', {
  lazy: true,
  default: () => []
})

if (error.value) {
  toast.add({ title: 'Lỗi', description: 'Không thể tải danh sách giám sát.', color: 'error' })
}

// (Tuân thủ Rule 3)
const getActionItems = (row: any): DropdownMenuItem[][] => [
  [{
    label: 'Xem chi tiết',
    icon: 'i-heroicons-chart-bar-20-solid',
    onSelect: () => navigateTo(`/api-monitoring/${row.original._id}`)
  }, {
    label: 'Sửa',
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
    await $fetch(`/api/monitors/${id}`, { method: 'PATCH' })
    toast.add({ title: 'Thành công', description: 'Đã cập nhật trạng thái.' })
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể cập nhật.', color: 'error' })
  }
}

// Hàm mở Modal Xóa
function openDeleteModal(row: any) {
  monitorToDelete.value = row
  isDeleteModalOpen.value = true
}

// Hàm xác nhận Xóa
async function confirmDelete() {
  if (!monitorToDelete.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/monitors/${monitorToDelete.value.original._id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xóa', description: `Đã xóa ${monitorToDelete.value.original.name}.` })
    isDeleteModalOpen.value = false
    monitorToDelete.value = null
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể xóa.', color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}
</script>
