<template>
  <UDashboardPanel id="status-page-settings">
    <template #header>
      <UDashboardNavbar title="Cấu hình Trang Trạng thái Công khai" />
    </template>

    <template #body>
      <div class="p-4 grid grid-cols-1 gap-6">
        <UCard>
          <template #header>
            <h3 class="font-semibold text-lg">
              Cài đặt Chung
            </h3>
          </template>

          <UForm
            :state="state"
            :schema="schema"
            class="space-y-4"
            @submit="saveConfig"
          >
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <UFormField
                label="Bật Trang Trạng thái Công khai"
                name="isEnabled"
              >
                <USwitch v-model="state.isEnabled" />
                <template #help>
                  Cho phép người khác xem trạng thái dịch vụ của bạn qua một trang công khai.
                </template>
              </UFormField>

              <template v-if="state.isEnabled">
                <UFormField
                  label="Đường dẫn Công khai (Slug)"
                  name="slug"
                  required
                >
                  <UInput
                    v-model="state.slug"
                    placeholder="vi-du-cong-ty"
                  />
                  <template #help>
                    Địa chỉ trang trạng thái của bạn. Chỉ chứa chữ thường, số và '-'.
                  </template>
                </UFormField>

                <UFormField
                  label="Tên miền Tùy chỉnh (Tùy chọn)"
                  name="customDomain"
                >
                  <UInput
                    v-model="state.customDomain"
                    placeholder="status.cong-ty-cua-ban.com"
                    icon="i-heroicons-globe-alt"
                  />
                  <template #help>
                    Trỏ CNAME của tên miền này tới <code class="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">public.headless-sentry.com</code>.
                  </template>
                </UFormField>
              </template>

              <UFormField
                label="Tiêu đề Trang"
                name="title"
                required
              >
                <UInput
                  v-model="state.title"
                  placeholder="Trạng thái Dịch vụ ABC"
                />
              </UFormField>

              <UFormField
                label="Logo Trang (Tùy chọn)"
                name="logoUrl"
              >
                <div class="flex items-center gap-4">
                  <UButton
                    label="Tải lên Logo"
                    icon="i-heroicons-arrow-up-tray"
                    color="neutral"
                    variant="outline"
                    :loading="uploading"
                    @click="triggerFileInput"
                  />
                  <input
                    ref="fileInput"
                    type="file"
                    class="hidden"
                    accept="image/png, image/jpeg, image/gif, image/svg+xml"
                    @change="handleFileChange"
                  >
                  <UAvatar
                    :src="state.logoUrl || undefined"
                    :alt="state.title || 'Logo'"
                    icon="i-heroicons-photo"
                    size="md"
                  />
                  <UButton
                    v-if="state.logoUrl"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="ghost"
                    size="sm"
                    square
                    aria-label="Xóa logo"
                    @click="removeLogo"
                  />
                </div>
                <template #help>
                  Định dạng ảnh: PNG, JPG, GIF, SVG. Kích thước tối đa 2MB.
                </template>
              </UFormField>
            </div>

            <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
              <UButton
                type="submit"
                :loading="saving"
                label="Lưu cấu hình"
                color="primary"
              />
            </div>
          </UForm>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-lg">
              Chọn Dịch vụ Hiển thị
            </h3>
          </template>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Đánh dấu vào các dịch vụ bạn muốn hiển thị trên trang trạng thái công khai.
          </p>
          <UTable
            v-model="selectedMonitors"
            :data="monitors"
            :columns="monitorColumns"
            :loading="pendingMonitors"
            by="_id"
          />
          <div class="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <UButton
              :loading="savingSelection"
              label="Lưu Lựa chọn Dịch vụ"
              color="primary"
              @click="saveMonitorSelection"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, watch, h } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { UCheckbox, USwitch } from '#components'

const toast = useToast()

// === Logic Cấu hình Chung ===
const saving = ref(false)
const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/
// (Nâng cấp) Schema validation
const schema = z.object({
  isEnabled: z.boolean().default(false),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).nullable().optional(),
  title: z.string().min(1).default('Trạng thái Dịch vụ'),
  logoUrl: z.string().url().nullable().optional(), // Vẫn validate URL
  customDomain: z.string()
    .regex(domainRegex, { message: 'Tên miền không hợp lệ' })
    .nullable().optional()
    .transform(val => val ? val.toLowerCase().trim() : null)
})
type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ isEnabled: false, slug: '', title: '', logoUrl: null, customDomain: null })

const projectId = useRoute().params.projectId as string
// Fetch cấu hình hiện tại (Giữ nguyên)
const { data: currentConfig, pending: pendingConfig, error: errorConfig } = await useFetch(`/api/projects/${projectId}/status-page/config`)
watch(currentConfig, (newConfig) => {
  if (newConfig) {
    Object.assign(state, newConfig)
  }
}, { immediate: true })

// Lưu Cấu hình Chung (Giữ nguyên)
async function saveConfig(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const updated = await $fetch(`/api/projects/${projectId}/status-page/config`, { method: 'PUT', body: event.data })
    Object.assign(state, updated)
    toast.add({ title: 'Đã lưu cấu hình chung.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể lưu.', color: 'error' })
  } finally {
    saving.value = false
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// Kích hoạt input file ẩn
function triggerFileInput() {
  fileInput.value?.click()
}

// Xử lý khi chọn file
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Giới hạn kích thước (vd: 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.add({ title: 'Lỗi', description: 'Kích thước file quá lớn (tối đa 2MB).', color: 'error' })
    return
  }

  uploading.value = true
  try {
    // 1. Lấy Pre-signed URL từ backend
    const { uploadUrl, publicUrl } = await $fetch<{ uploadUrl: string, publicUrl: string }>('/api/upload/presigned-url', {
      method: 'POST',
      body: {
        fileName: file.name,
        fileType: file.type
      }
    })

    // 2. Upload file lên R2 (hoặc S3) bằng Pre-signed URL
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })

    // 3. Cập nhật state với publicUrl mới
    state.logoUrl = publicUrl
    toast.add({ title: 'Thành công', description: 'Đã tải lên logo.', color: 'success' })
  } catch (err: any) {
    console.error('Upload error:', err)
    toast.add({ title: 'Lỗi Upload', description: err.data?.message || 'Không thể tải lên file.', color: 'error' })
  } finally {
    uploading.value = false
    // Reset input file để có thể chọn lại cùng file
    if (fileInput.value) fileInput.value.value = ''
  }
}

// (Mới) Hàm xóa logo
function removeLogo() {
  state.logoUrl = null
  // Cần gọi saveConfig để lưu thay đổi này vào DB
  // Hoặc có thể thêm nút "Lưu" riêng cho logo
  toast.add({ title: 'Đã xóa logo', description: 'Nhấn "Lưu Cấu hình Chung" để áp dụng.' })
}

const savingSelection = ref(false)
const selectedMonitors = ref<any[]>([])

const monitorColumns = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
          if (value) {
            const pageRows = table.getPageRows()
            pageRows.forEach((row) => {
              if (!selectedMonitors.value.find(m => m._id === row.original._id)) {
                selectedMonitors.value.push(row.original)
              }
            })
          } else {
            const pageRowIds = table.getPageRows().map(row => row.original._id)
            selectedMonitors.value = selectedMonitors.value.filter(m => !pageRowIds.includes(m._id))
          }
          table.toggleAllPageRowsSelected(!!value)
        },
        'aria-label': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': selectedMonitors.value.find(m => m._id === row.original._id)
          ? true
          : false,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
          if (value) {
            selectedMonitors.value.push(row.original)
          } else {
            selectedMonitors.value = selectedMonitors.value.filter(m => m._id !== row.original._id)
          }
          row.toggleSelected(!!value)
        },
        'aria-label': 'Select row'
      })
  },
  { accessorKey: 'name', header: 'Tên Dịch vụ' },
  { accessorKey: 'endpoint', header: 'Endpoint' }
]

const { data: monitors, pending: pendingMonitors, refresh: refreshMonitors } = await useFetch(`/api/projects/${projectId}/monitors`, {
  default: () => [],
  transform: (data: any[]) => data.map((m: any) => ({ _id: m._id, name: m.name, endpoint: m.endpoint, isPublic: m.isPublic }))
})

watch(monitors, (newMonitors) => {
  if (newMonitors) {
    selectedMonitors.value = newMonitors.filter(m => m.isPublic)
  }
}, { immediate: true })

async function saveMonitorSelection() {
  savingSelection.value = true
  const selectedIds = selectedMonitors.value.map(m => m._id)
  try {
    await $fetch(`/api/projects/${projectId}/monitors/public-selection`, { method: 'PUT', body: { selectedIds } })
    toast.add({ title: 'Đã lưu lựa chọn dịch vụ.', color: 'success' })
    await refreshMonitors() // Tải lại để cập nhật isPublic
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể lưu lựa chọn.', color: 'error' })
  } finally {
    savingSelection.value = false
  }
}
</script>
