<template>
  <UDashboardPanel id="status-page-settings">
    <template #header>
      <UDashboardNavbar title="Cấu hình Trang Trạng thái">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <h3 class="font-semibold">
        Cài đặt Chung
      </h3>

      <UForm
        :state="state"
        :schema="schema"
        class="space-y-4"
        @submit="saveConfig"
      >
        <UFormField
          label="Bật Trang Trạng thái Công khai"
          name="isEnabled"
        >
          <USwitch v-model="state.isEnabled" />
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
              Chỉ chứa chữ thường, số và dấu gạch ngang.
            </template>
          </UFormField>

          <!-- <UFormField
            label="Tên miền Tùy chỉnh (Tùy chọn)"
            name="customDomain"
            help="Trỏ CNAME của tên miền này tới 'your-target-domain.com'"
            __
          >
            <UInput
              v-model="state.customDomain"
              placeholder="status.cong-ty-cua-ban.com"
              icon="i-heroicons-globe-alt"
            />
            <template #help>
              Ví dụ: status.mycompany.com. Bạn cần cấu hình DNS CNAME trỏ về <code class="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">public.headless-sentry.com</code>.
            </template> __
          </UFormField> -->
        </template>

        <UFormField
          label="Tiêu đề Trang"
          name="title"
          required
        >
          <UInput v-model="state.title" />
        </UFormField>

        <UFormField
          label="URL Logo (Tùy chọn)"
          name="logoUrl"
        >
          <UInput
            v-model="state.logoUrl"
            type="url"
            placeholder="https://..."
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            type="submit"
            :loading="saving"
            label="Lưu Cấu hình"
            color="primary"
          />
        </div>
      </UForm>

      <h3 class="font-semibold">
        Chọn Dịch vụ Hiển thị
      </h3>
      <p class="text-sm text-gray-500 mb-4">
        Đánh dấu vào các dịch vụ bạn muốn hiển thị trên trang trạng thái công khai.
      </p>
      <UTable
        v-model="selectedMonitors"
        :data="monitors"
        :columns="monitorColumns"
        :loading="pendingMonitors"
        by="_id"
      />
      <div class="flex justify-end mt-4">
        <UButton
          :loading="savingSelection"
          label="Lưu Lựa chọn"
          @click="saveMonitorSelection"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()

// === Logic Cấu hình Chung ===
const saving = ref(false)
const schema = z.object({
  isEnabled: z.boolean().default(false),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).nullable().optional(),
  title: z.string().min(1).default('Trạng thái Dịch vụ'),
  logoUrl: z.string().url().nullable().optional(),
  // customDomain: z.string()
  //   .regex(domainRegex, { message: 'Tên miền không hợp lệ' })
  //   .nullable().optional()
  //   .transform(val => val ? val.toLowerCase().trim() : null) // Chuẩn hóa
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ isEnabled: false, slug: '', title: '', logoUrl: null, customDomain: null })
// Fetch cấu hình hiện tại khi load trang
const { data: currentConfig, pending: pendingConfig, error: errorConfig } = await useFetch('/api/status-page/config')

watch(currentConfig, (newConfig) => {
  if (newConfig) {
    Object.assign(state, newConfig)
  }
}, { immediate: true })

async function saveConfig(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const updated = await $fetch('/api/status-page/config', {
      method: 'PUT',
      body: event.data
    })
    Object.assign(state, updated) // Cập nhật lại state sau khi lưu
    toast.add({ title: 'Đã lưu cấu hình trang trạng thái.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể lưu.', color: 'error' })
  } finally {
    saving.value = false
  }
}

// === Logic Chọn Monitor ===
const savingSelection = ref(false)
const selectedMonitors = ref<any[]>([]) // V-model cho UTable checkbox

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

// Fetch danh sách monitor của user
const { data: monitors, pending: pendingMonitors } = await useFetch('/api/monitors', {
  default: () => [],
  transform: data => data.map((m: any) => ({ _id: m._id, name: m.name, endpoint: m.endpoint, isPublic: m.isPublic })) // Chỉ lấy trường cần thiết
})

// Đồng bộ selectedMonitors với isPublic từ API
watch(monitors, (newMonitors) => {
  if (newMonitors) {
    selectedMonitors.value = newMonitors.filter(m => m.isPublic)
  }
}, { immediate: true })

// (MỚI) API để lưu isPublic (cần tạo API này)
async function saveMonitorSelection() {
  savingSelection.value = true
  const selectedIds = selectedMonitors.value.map(m => m._id)

  try {
    // === Cần tạo API endpoint này: PUT /api/monitors/public-selection ===
    // API này sẽ nhận mảng selectedIds và cập nhật isPublic cho TẤT CẢ monitor của user
    await $fetch('/api/monitors/public-selection', {
      method: 'PUT',
      body: { selectedIds }
    })
    toast.add({ title: 'Đã lưu lựa chọn dịch vụ công khai.', color: 'success' })
    // Cập nhật lại trạng thái isPublic cục bộ (tùy chọn)
    monitors.value?.forEach((m) => { m.isPublic = selectedIds.includes(m._id) })
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể lưu lựa chọn.', color: 'error' })
  } finally {
    savingSelection.value = false
  }
}
</script>
