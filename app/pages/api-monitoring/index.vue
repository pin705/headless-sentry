<template>
  <UDashboardPanel id="api-monitoring">
    <template #header>
      <UDashboardNavbar title="API Giám sát">
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
              @click="openFormModal(null)"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <UTable
          :data="monitors"
          :columns="columns"
          :loading="pending"
          :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Chưa có API nào được giám sát.' }"
        />
      </UCard>

      <UModal v-model:open="isDeleteModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold">
            Xác nhận Xóa
          </h3>
        </template>

        <template #body>
          <p>Bạn có chắc chắn muốn xóa API giám sát <strong>{{ monitorToDelete?.original?.name }}</strong> không? Hành động này không thể hoàn tác.</p>
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

      <UModal
        v-model:open="isFormModalOpen"
        prevent-close
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              {{ isEditing ? 'Chỉnh sửa API Giám sát' : 'Thêm API Giám sát mới' }}
            </h2>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isFormModalOpen = false"
            />
          </div>
        </template>

        <template #body>
          <UForm
            :state="formState"
            :schema="formSchema"
            class="space-y-4"
            @submit="onFormSubmit"
          >
            <UFormField
              label="Tên gợi nhớ"
              name="name"
            >
              <UInput
                v-model="formState.name"
                placeholder="Ví dụ: API Sản phẩm Shopify"
              />
            </UFormField>

            <UFormField
              label="Endpoint URL"
              name="endpoint"
            >
              <UInput
                v-model="formState.endpoint"
                type="url"
                placeholder="https://your-api.com/endpoint"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Method"
                name="method"
              >
                <USelect
                  v-model="formState.method"
                  :options="methodOptions"
                />
              </UFormField>

              <UFormField
                label="Tần suất"
                name="frequency"
              >
                <USelect
                  v-model.number="formState.frequency"
                  :options="frequencyOptions"
                />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <UButton
                color="neutral"
                variant="ghost"
                @click="isFormModalOpen = false"
              >
                Hủy
              </UButton>
              <UButton
                type="submit"
                :loading="formLoading"
                :label="isEditing ? 'Lưu thay đổi' : 'Thêm Giám sát'"
                color="primary"
              />
            </div>
          </UForm>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, ref, reactive, computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const toast = useToast()

// === (MỚI) Logic Form ===
const formLoading = ref(false)
const isFormModalOpen = ref(false)
const monitorToEdit = ref<any>(null) // Lưu trữ monitor *original* đang được edit

// Computed property để biết đang edit hay create
const isEditing = computed(() => !!monitorToEdit.value)

// Các tùy chọn phải khớp với backend
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const frequencyOptions = [
  { label: 'Mỗi 1 phút', value: 60 },
  { label: 'Mỗi 5 phút', value: 300 },
  { label: 'Mỗi 10 phút', value: 600 },
  { label: 'Mỗi 30 phút', value: 1800 },
  { label: 'Mỗi 1 giờ', value: 3600 }
]

// Schema validation dùng Zod
const formSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ'),
  method: z.enum(methodOptions as [string, ...string[]]).default('GET'),
  frequency: z.number().default(60)
})

type Schema = z.output<typeof formSchema>

// State cho form
const defaultFormState: Schema = {
  name: '',
  endpoint: '',
  method: 'GET',
  frequency: 60
}
const formState = reactive<Schema>({ ...defaultFormState })

// (MỚI) Hàm mở Modal (Create/Edit)
function openFormModal(monitorOriginal: any | null) {
  if (monitorOriginal) {
    // Chế độ Edit
    monitorToEdit.value = monitorOriginal
    // Điền dữ liệu cũ vào form
    formState.name = monitorOriginal.name
    formState.endpoint = monitorOriginal.endpoint
    formState.method = monitorOriginal.method
    formState.frequency = monitorOriginal.frequency
  } else {
    // Chế độ Create
    monitorToEdit.value = null
    // Reset form về mặc định
    Object.assign(formState, defaultFormState)
  }
  isFormModalOpen.value = true
}

// (MỚI) Hàm Submit Form (Xử lý cả Create và Edit)
async function onFormSubmit(event: FormSubmitEvent<Schema>) {
  formLoading.value = true
  try {
    if (isEditing.value) {
      // --- Chế độ EDIT (dùng API PUT) ---
      await $fetch(`/api/monitors/${monitorToEdit.value._id}`, { // _id ở đây là đúng
        method: 'PUT',
        body: event.data
      })
      toast.add({ title: 'Thành công', description: 'Đã cập nhật API giám sát.' })
    } else {
      // --- Chế độ CREATE (dùng API POST) ---
      await $fetch('/api/monitors', { // Đổi tên từ index.post.ts thành monitors.post.ts nếu cần
        method: 'POST',
        body: event.data
      })
      toast.add({ title: 'Thành công', description: 'Đã thêm API giám sát.' })
    }

    isFormModalOpen.value = false // Đóng modal
    refresh() // Tải lại bảng
  } catch (err: any) {
    console.error('Lỗi khi submit form:', err)
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Thao tác thất bại.', color: 'error' })
  } finally {
    formLoading.value = false
  }
}

// === Logic Bảng (Đã cập nhật) ===

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

function createSslIcon(row: any) {
  // (Tuân thủ Rule 3)
  const ssl = row.original.ssl
  if (!ssl || ssl.daysRemaining === null) {
    return null // Không có data
  }

  let iconName: string
  let colorClass: string // (Tuân thủ Rule 7)
  let tooltipText: string

  console.log('SSL data for monitor:', ssl)
  // (Tuân thủ Rule 7)
  if (ssl.daysRemaining < 0) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-error-500'
    tooltipText = `SSL đã hết hạn ${Math.abs(ssl.daysRemaining)} ngày trước!`
  } else if (ssl.daysRemaining < 14) { // Cảnh báo < 14 ngày
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-warning-500' // (Tuân thủ Rule 7)
    tooltipText = `SSL sẽ hết hạn sau ${ssl.daysRemaining} ngày.`
  } else {
    // SSL ổn (> 14 ngày)
    return null // Không cần hiển thị icon
  }

  const icon = h(UIcon, { name: iconName, class: colorClass })
  return h(UTooltip, { text: tooltipText }, () => icon)
}

// (Tuân thủ Rule 5)
const columns = [
  { accessorKey: 'latestStatus', header: 'Trạng thái', class: 'w-24',
    cell: ({ row }: any) => {
      const { color, label } = getStatusAppearance(row.original.status)
      return h(UBadge, { color: color, variant: 'soft', class: 'w-20 justify-center' }, () => label)
    }
  },
  { accessorKey: 'name', header: 'Tên',
    cell: ({ row }: any) => {
      // (Tuân thủ Rule 3)
      const monitor = row.original
      const sslIcon = createSslIcon(row) // (MỚI) Lấy icon SSL

      console.log('Rendering name cell for monitor:', sslIcon)
      // (MỚI) Tạo các vnodes
      const nameText = h('span', { class: 'font-medium text-base' }, monitor.name)
      const endpointBadge = h(UBadge, { label: monitor.method, color: 'neutral', variant: 'subtle', size: 'xs' })
      const endpointText = h('span', { class: 'truncate max-w-sm' }, monitor.endpoint)
      const endpointDiv = h('span', { class: 'text-gray-500 dark:text-gray-400 text-sm font-mono flex items-center gap-1.5' }, [endpointBadge, endpointText])

      // (MỚI) Hiển thị tên và icon SSL (nếu có)
      const nameDiv = h('div', { class: 'flex items-center gap-1.5' }, [
        nameText,
        sslIcon // Thêm icon vào
      ])


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
      ? h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, formatTimeAgo(new Date(row.original.latestCheckedAt)))
      : h('span', { class: 'text-gray-400' }, 'Chưa chạy')
  },
  {
    accessorKey: 'actions',
    header: '',
    class: 'w-10 text-right',
    // (Tuân thủ Rule 3, 4)
    cell: ({ row }: any) => h(UDropdownMenu,
      { items: getActionItems(row), content: { align: 'end' } },
      () => h(UButton, { icon: 'i-heroicons-ellipsis-horizontal-20-solid', color: 'neutral', variant: 'ghost' })
    )
  }
]

// Modal Xóa
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const monitorToDelete = ref<any>(null) // Lưu trữ *table row object*

// (Tuân thủ Rule 6)
const { data: monitors, pending, error, refresh } = await useFetch('/api/monitors', {
  lazy: true,
  default: () => []
})

if (error.value) {
  console.error('Lỗi tải monitors:', error.value)
  toast.add({ title: 'Lỗi', description: 'Không thể tải danh sách giám sát.', color: 'error' })
}

// (Tuân thủ Rule 3)
const getActionItems = (row: any): DropdownMenuItem[][] => [
  [{
    label: 'Xem chi tiết',
    icon: 'i-heroicons-chart-bar-20-solid',
    onSelect: () => navigateTo(`/api-monitoring/${row.original._id}`) // Sử dụng row.original._id
  }, {
    label: 'Sửa', // (MỚI)
    icon: 'i-heroicons-pencil-square-20-solid',
    onSelect: () => openFormModal(row.original) // Sử dụng row.original
  }, {
    label: row.original.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt',
    icon: row.original.status === 'ACTIVE' ? 'i-heroicons-pause-circle-20-solid' : 'i-heroicons-play-circle-20-solid',
    onSelect: () => toggleStatus(row.original._id) // Sử dụng row.original._id
  }],
  [{
    label: 'Xóa',
    icon: 'i-heroicons-trash-20-solid',
    labelClass: 'text-error-500 dark:text-error-400', // (Rule 7)
    onSelect: () => openDeleteModal(row) // Truyền cả 'row' object
  }]
]

// Hàm Tạm dừng / Kích hoạt
async function toggleStatus(id: string) {
  try {
    await $fetch(`/api/monitors/${id}`, { method: 'PATCH' })
    toast.add({ title: 'Thành công', description: 'Đã cập nhật trạng thái.' })
    refresh() // Tải lại dữ liệu
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể cập nhật.', color: 'error' })
  }
}

// Hàm mở Modal Xóa (nhận 'row' object)
function openDeleteModal(row: any) {
  monitorToDelete.value = row
  isDeleteModalOpen.value = true
}

// Hàm xác nhận Xóa
async function confirmDelete() {
  if (!monitorToDelete.value) return
  deleteLoading.value = true

  try {
    // (Tuân thủ Rule 3) Sửa lỗi logic:
    await $fetch(`/api/monitors/${monitorToDelete.value.original._id}`, { method: 'DELETE' })

    toast.add({ title: 'Đã xóa', description: `Đã xóa ${monitorToDelete.value.original.name}.` })
    isDeleteModalOpen.value = false
    monitorToDelete.value = null
    refresh() // Tải lại dữ liệu
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể xóa.', color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}
</script>
