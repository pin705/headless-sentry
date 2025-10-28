<template>
  <div class="p-4 sm:p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">API Giám sát</h1>
      <div class="flex items-center gap-4">
        <UButton
          :icon="pending ? 'i-heroicons-arrow-path-solid' : 'i-heroicons-arrow-path'"
          :loading="pending"
          variant="ghost"
          color="gray"
          @click="refresh()"
          aria-label="Làm mới"
        />
        <UButton to="/dashboard/new" icon="i-heroicons-plus-solid" label="Thêm mới" />
      </div>
    </div>

    <UCard>
      <UTable
        :data="monitors"
        :columns="columns"
        :loading="pending"
        :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Chưa có API nào được giám sát.' }"
      >
      </UTable>
    </UCard>

    <UModal v-model:open="isDeleteModalOpen">
       <template #header>
          <h3 class="text-lg font-semibold">Xác nhận Xóa</h3>
        </template>

     <template #body>

        <p>Bạn có chắc chắn muốn xóa API giám sát <strong>{{ monitorToDelete?.name }}</strong> không? Hành động này không thể hoàn tác.</p>

     </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="isDeleteModalOpen = false">Hủy</UButton>
            <UButton color="error" :loading="deleteLoading" @click="confirmDelete">Xóa</UButton>
          </div>
        </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// Định nghĩa cột cho UTable
const columns = [
  { accessorKey: 'latestStatus', header: 'Trạng thái', class: 'w-20',
    cell: ({ row }) => {
      const status = row.original.status || 'N/A'
      const color = statusColor(status)
      return h(UBadge, { color }, statusLabel(status))
    }
  },
  { accessorKey: 'name', header: 'Tên', class: 'font-medium', cell: ({ row }) => row.original.name },
  { accessorKey: 'latestLatency', header: 'Độ trễ', cell: ({ row }) => row.original.latestLatency ? `${row.original.latestLatency} ms` : 'N/A' },
  { accessorKey: 'latestCheckedAt', header: 'Kiểm tra cuối', cell: ({ row }) => row.original.latestCheckedAt },
  // { key: 'frequency', label: 'Tần suất' }, // Có thể ẩn đi cho gọn
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'text-right' }, h(UDropdownMenu,
      { items: getActionItems(row), content: { align: 'end' } },
      () => h(UButton, { icon: 'i-heroicons-ellipsis-horizontal-20-solid', color: 'gray', variant: 'ghost' })
    ))
  }
]

// Modal Xóa
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const monitorToDelete = ref<any>(null)

// Gọi API lấy danh sách monitors (đã bao gồm status)
const { data: monitors, pending, error, refresh } = await useFetch('/api/monitors', {
  lazy: true,
  default: () => [],
})

if (error.value) {
  console.error("Lỗi tải monitors:", error.value);
  toast.add({ title: 'Lỗi', description: 'Không thể tải danh sách giám sát.', color: 'red' })
}

// Logic cho màu sắc Status
function statusColor(status: string): string {
  if (status === 'PAUSED') return 'warning'
  if (status === 'ACTIVE') return 'success'
  if (status === 'DOWN') return 'error'
  return 'neutral' // Cho 'N/A'
}

function statusLabel(status: string): string {
  if (status === 'PAUSED') return 'Tạm dừng'
  if (status === 'ACTIVE') return 'Hoạt động'
  if (status === 'DOWN') return 'Ngưng hoạt động'
  return 'N/A' // Cho 'N/A'
}

// Xử lý Actions
const getActionItems = (row: any) => [
  [{
    label: 'Xem chi tiết',
    icon: 'i-heroicons-chart-bar-20-solid',
    onSelect: () => navigateTo(`/dashboard/${row.original._id}`) // TODO: Tạo trang chi tiết
  }, {
    label: row.original.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt',
    icon: row.original.status === 'ACTIVE' ? 'i-heroicons-pause-circle-20-solid' : 'i-heroicons-play-circle-20-solid',
    onSelect: () => toggleStatus(row.original._id)
  }],
  [{
    label: 'Xóa',
    icon: 'i-heroicons-trash-20-solid',
    labelClass: 'text-red-500 dark:text-red-400',
    onSelect: () => openDeleteModal(row)
  }]
]

// Hàm Tạm dừng / Kích hoạt
async function toggleStatus(id: string) {
  try {
    console.log('Toggling status for monitor ID:', id)
    await $fetch(`/api/monitors/${id}`, { method: 'PATCH' })
    toast.add({ title: 'Thành công', description: 'Đã cập nhật trạng thái.' })
    refresh() // Tải lại dữ liệu
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể cập nhật.', color: 'red' })
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
    await $fetch(`/api/monitors/${monitorToDelete.value._id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xóa', description: `Đã xóa ${monitorToDelete.value.name}.` })
    isDeleteModalOpen.value = false
    monitorToDelete.value = null
    refresh() // Tải lại dữ liệu
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể xóa.', color: 'red' })
  } finally {
    deleteLoading.value = false
  }
}
</script>
