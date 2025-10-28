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
          <p>Bạn có chắc chắn muốn xóa dịch vụ <strong>{{ monitorToDelete?.original?.name }}</strong> không? Hành động này không thể hoàn tác.</p>
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
              {{ isEditing ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới' }}
            </h2>
          </div>
        </template>

        <template #body>
          <UForm
            :state="formState"
            :schema="formSchema"
            @submit="onFormSubmit"
          >
            <UTabs :items="formTabs">
              <template #basic="{ item }">
                <div class="space-y-4 pt-4">
                  <UFormField
                    label="Tên gợi nhớ"
                    name="name"
                    required
                  >
                    <UInput
                      v-model="formState.name"
                      class="w-full"
                      placeholder="Ví dụ: API Sản phẩm Shopify"
                    />
                  </UFormField>

                  <UFormField
                    label="Endpoint URL"
                    name="endpoint"
                    required
                  >
                    <UInput
                      v-model="formState.endpoint"
                      class="w-full"
                      type="url"
                      placeholder="https://your-api.com/endpoint"
                    />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField
                      label="Method"
                      name="method"
                    >
                      <USelectMenu
                        v-model="formState.method"
                        class="w-full"
                        :items="methodOptions"
                      />
                    </UFormField>

                    <UFormField
                      label="Tần suất"
                      name="frequency"
                    >
                      <USelectMenu
                        v-model="formState.frequency"
                        class="w-full"
                        :items="frequencyOptions"
                        value-key="value"
                      />
                    </UFormField>
                  </div>
                </div>
              </template>

              <template #advanced="{ item }">
                <div class="space-y-4 pt-4">
                  <UFormField
                    label="HTTP Headers"
                    name="httpConfig.headers"
                  >
                    <div class="space-y-2">
                      <div
                        v-for="(header, index) in formState.httpConfig.headers"
                        :key="index"
                        class="flex items-center gap-2"
                      >
                        <UInput
                          v-model="header.key"
                          placeholder="Key (ví dụ: Authorization)"
                          class="flex-1 w-full"
                        />
                        <UInput
                          v-model="header.value"
                          placeholder="Value (ví dụ: Bearer ...)"
                          class="flex-1 w-full"
                        />
                        <UButton
                          icon="i-heroicons-trash"
                          color="error"
                          variant="ghost"
                          @click="removeHeader(index)"
                        />
                      </div>
                      <UButton
                        label="Thêm Header"
                        icon="i-heroicons-plus"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        @click="addHeader"
                      />
                    </div>
                  </UFormField>

                  <UFormField
                    label="Request Body"
                    name="httpConfig.bodyType"
                    class="mt-4"
                  >
                    <USelectMenu
                      v-model="formState.httpConfig.bodyType"
                      :items="bodyTypeOptions"
                      value-key="key"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    v-if="formState.httpConfig.bodyType !== 'none'"
                    name="httpConfig.body"
                    class="mt-2"
                  >
                    <UTextarea
                      v-model="formState.httpConfig.body"
                      :placeholder="formState.httpConfig.bodyType === 'json' ? 'Nhập nội dung JSON, ví dụ: {&quot;id&quot;: 1}' : 'Nhập nội dung text...'"
                      :rows="5"
                      autoresize
                         class="w-full"
                    />
                  </UFormField>
                </div>
              </template>
            </UTabs>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
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
                :label="isEditing ? 'Lưu thay đổi' : 'Thêm Dịch vụ'"
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

// === Logic Form (Nâng cấp) ===
const formLoading = ref(false)
const isFormModalOpen = ref(false)
const monitorToEdit = ref<any>(null) // Lưu trữ monitor *original*

const isEditing = computed(() => !!monitorToEdit.value)

const formTabs = [
  {
    slot: 'basic',
    label: 'Cài đặt Cơ bản'
  },
  {
    slot: 'advanced',
    label: 'Cài đặt Nâng cao (Tùy chọn)'
  }
]

// Các tùy chọn select
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const frequencyOptions = [
  { label: 'Mỗi 1 phút', value: 60 },
  { label: 'Mỗi 5 phút', value: 300 },
  { label: 'Mỗi 10 phút', value: 600 },
  { label: 'Mỗi 30 phút', value: 1800 },
  { label: 'Mỗi 1 giờ', value: 3600 }
]
const bodyTypeOptions = [
  { key: 'none', label: 'Không có Body' },
  { key: 'json', label: 'JSON (application/json)' },
  { key: 'raw', label: 'Raw Text (text/plain)' }
]

// (Nâng cấp) Zod Schema
const formSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ'),
  method: z.enum(methodOptions as [string, ...string[]]).default('GET'),
  frequency: z.number().default(60),

  httpConfig: z.object({
    headers: z.array(z.object({
      key: z.string().min(1, 'Header Key không được trống'),
      value: z.string()
    })).default([]),
    body: z.string().nullable().default(null),
    bodyType: z.enum(['none', 'json', 'raw']).default('none')
  }).default({ headers: [], body: null, bodyType: 'none' })
})

type Schema = z.output<typeof formSchema>

// (Nâng cấp) State mặc định cho form
const defaultFormState: Schema = {
  name: '',
  endpoint: '',
  method: 'GET',
  frequency: 60,
  httpConfig: {
    headers: [],
    body: null,
    bodyType: 'none'
  }
}
const formState = reactive<Schema>({ ...defaultFormState })

// (Mới) Hàm helper cho Form Headers
function addHeader() {
  formState.httpConfig.headers.push({ key: '', value: '' })
}
function removeHeader(index: number) {
  formState.httpConfig.headers.splice(index, 1)
}

// (Nâng cấp) Hàm mở Modal
function openFormModal(monitorOriginal: any | null) {
  if (monitorOriginal) {
    // Chế độ Edit
    monitorToEdit.value = monitorOriginal
    formState.name = monitorOriginal.name
    formState.endpoint = monitorOriginal.endpoint
    formState.method = monitorOriginal.method
    formState.frequency = monitorOriginal.frequency
    // (Nâng cấp) Dùng deep copy cho httpConfig
    formState.httpConfig = JSON.parse(JSON.stringify(
      monitorOriginal.httpConfig || defaultFormState.httpConfig
    ))
  } else {
    // Chế độ Create
    monitorToEdit.value = null
    // (Nâng cấp) Reset form về mặc định (dùng deep copy)
    Object.assign(formState, JSON.parse(JSON.stringify(defaultFormState)))
  }
  isFormModalOpen.value = true
}

// (Nâng cấp) Hàm Submit Form (Xử lý cả Create và Edit)
async function onFormSubmit(event: FormSubmitEvent<Schema>) {
  formLoading.value = true
  try {
    if (isEditing.value) {
      // --- Chế độ EDIT (dùng API PUT) ---
      // (Tuân thủ Rule 3)
      await $fetch(`/api/monitors/${monitorToEdit.value._id}`, {
        method: 'PUT',
        body: event.data
      })
      toast.add({ title: 'Thành công', description: 'Đã cập nhật dịch vụ.' })
    } else {
      // --- Chế độ CREATE (dùng API POST) ---
      await $fetch('/api/monitors', {
        method: 'POST',
        body: event.data
      })
      toast.add({ title: 'Thành công', description: 'Đã thêm dịch vụ.' })
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

// === Logic Bảng (Tuân thủ 7 Rules) ===
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

// (Mới) Hàm helper tạo icon SSL (Đã sửa lỗi logic)
function createSslIcon(row: any) {
  // (Tuân thủ Rule 3)
  const ssl = row.original.ssl

  // 1. Kiểm tra không có dữ liệu
  if (!ssl || ssl.daysRemaining === null) {
    const icon = h(UIcon, {
      name: 'i-heroicons-shield-exclamation',
      // (Tuân thủ Rule 7)
      class: 'text-neutral-400 dark:text-neutral-500'
    })
    return h(UTooltip, {
      text: 'Chưa kiểm tra SSL (thường chạy 1 lần/ngày)'
    }, () => icon)
  }

  let iconName: string
  let colorClass: string // (Tuân thủ Rule 7)
  let tooltipText: string

  // 2. Xử lý Lỗi (Hết hạn hoặc Invalid)
  if (!ssl.isValid || ssl.daysRemaining < 0) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-error-500' // (Rule 7)
    tooltipText = ssl.errorMessage
      ? `Lỗi: ${ssl.errorMessage}`
      : `SSL đã hết hạn ${Math.abs(ssl.daysRemaining)} ngày trước!`
  }
  // 3. Xử lý Cảnh báo (Sắp hết hạn, < 14 ngày)
  else if (ssl.daysRemaining < 14) {
    iconName = 'i-heroicons-shield-exclamation-solid'
    colorClass = 'text-warning-500' // (Rule 7)
    tooltipText = `SSL sẽ hết hạn sau ${ssl.daysRemaining} ngày (vào ${new Date(ssl.expiresAt).toLocaleDateString('vi-VN')}).`
  }
  // 4. Xử lý Tốt (Healthy)
  else {
    iconName = 'i-heroicons-shield-check-solid'
    colorClass = 'text-success-500' // (Rule 7)
    tooltipText = `SSL hợp lệ. Còn ${ssl.daysRemaining} ngày (hết hạn ${new Date(ssl.expiresAt).toLocaleDateString('vi-VN')}).`
  }

  // 5. Tạo vnode
  const icon = h(UIcon, { name: iconName, class: colorClass })
  return h(UTooltip, {
    text: tooltipText,
    popper: { placement: 'top', arrow: true }
  }, () => icon)
}

// (Tuân thủ Rule 5)
const historyColumns = [
  { accessorKey: 'latestStatus', header: 'Trạng thái', class: 'w-24',
    cell: ({ row }: any) => {
      // (Tuân thủ Rule 3, 7)
      const monitor = row.original
      const { color, label } = getStatusAppearance(monitor)
      return h(UBadge, { color: color, variant: 'soft', class: 'w-20 justify-center' }, () => label)
    }
  },
  {
    accessorKey: 'name',
    header: 'Dịch vụ', // (Header đã cập nhật)
    cell: ({ row }: any) => {
      // (Tuân thủ Rule 3)
      const monitor = row.original
      const sslIcon = createSslIcon(row)

      const nameText = h('span', { class: 'font-medium text-base' }, monitor.name)
      const endpointBadge = h(UBadge, { label: monitor.method, color: 'neutral', variant: 'subtle', size: 'xs' })
      const endpointText = h('span', { class: 'truncate max-w-sm' }, monitor.endpoint)
      const endpointDiv = h('span', { class: 'text-gray-500 dark:text-gray-400 text-sm font-mono flex items-center gap-1.5' }, [endpointBadge, endpointText])

      const nameDiv = h('div', { class: 'flex items-center gap-1.5' }, [
        nameText,
        sslIcon
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
      ? h('span', { class: 'text-sm' }, formatTimeAgo(new Date(row.original.latestCheckedAt)))
      : h('span', { class: 'text-gray-400' }, 'Chưa chạy')
  },
  { accessorKey: 'actions', header: '', class: 'w-10 text-right',
    cell: ({ row }: any) => h(UDropdownMenu,
      // (Tuân thủ Rule 3, 4)
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

// (Tuân thủ Rule 7)
function getStatusAppearance(monitorOriginal: any): { color: string, label: string } {
  if (monitorOriginal.status === 'PAUSED') {
    return { color: 'neutral', label: 'Tạm dừng' }
  }
  if (monitorOriginal.latestStatus === 'UP') {
    return { color: 'success', label: 'Hoạt động' }
  }
  if (monitorOriginal.latestStatus === 'DOWN') {
    return { color: 'error', label: 'Ngưng' }
  }
  return { color: 'neutral', label: 'N/A' }
}

// (Tuân thủ Rule 3)
const getActionItems = (row: any): DropdownMenuItem[][] => [
  [{
    label: 'Xem chi tiết',
    icon: 'i-heroicons-chart-bar-20-solid',
    onSelect: () => navigateTo(`/api-monitoring/${row.original._id}`) // Sử dụng row.original._id
  }, {
    label: 'Sửa', // (Nâng cấp)
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
    // (Tuân thủ Rule 3)
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
