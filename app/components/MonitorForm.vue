<template>
  <UModal
    v-model:open="isOpen"
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
          <template #basic>
            <div class="space-y-4 pt-4">
              <UFormField
                label="Dịch Vụ"
                name="name"
                required
              >
                <UInput
                  v-model="formState.name"
                  placeholder="Ví dụ: API Sản phẩm Shopify"
                  class="w-full"
                />
                <template #help>
                  Tên dễ nhớ cho dịch vụ giám sát của bạn
                </template>
              </UFormField>
              <UFormField
                label="Loại giám sát"
                name="type"
                required
              >
                <USelectMenu
                  v-model="formState.type"
                  :items="typeOptions"
                  value-key="value"
                  class="w-full"
                />
                <template #help>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <strong>HTTP:</strong> Kiểm tra endpoint API/Web qua HTTP/HTTPS<br>
                    <strong>Keyword:</strong> Kiểm tra xem trang web có chứa từ khóa cụ thể<br>
                    <strong>Ping:</strong> Kiểm tra kết nối mạng đến server (ICMP)<br>
                    <strong>Heartbeat:</strong> Nhận tín hiệu từ cronjob/service của bạn
                  </div>
                </template>
              </UFormField>
              <UFormField
                :label="formState.type === 'heartbeat' ? 'Tên monitor (không cần URL)' : 'Endpoint URL'"
                name="endpoint"
                required
              >
                <UInput
                  v-model="formState.endpoint"
                  :type="formState.type === 'heartbeat' ? 'text' : 'url'"
                  :placeholder="formState.type === 'heartbeat' ? 'backup-job' : 'https://your-api.com/endpoint'"
                  class="w-full"
                />
                <template
                  v-if="formState.type === 'heartbeat'"
                  #help
                >
                  URL ping sẽ được tạo tự động sau khi tạo monitor.
                </template>
              </UFormField>
              <UFormField
                v-if="formState.type === 'keyword'"
                label="Từ khóa"
                name="keyword"
                required
              >
                <UInput
                  v-model="formState.keyword"
                  placeholder="Nhập từ khóa cần tìm trong response"
                  class="w-full"
                />
                <template #help>
                  Hệ thống sẽ kiểm tra xem nội dung trang có chứa từ khóa này hay không.
                </template>
              </UFormField>
              <UFormField
                v-if="formState.type === 'heartbeat'"
                label="Khoảng thời gian dự kiến (giây)"
                name="expectedInterval"
                required
              >
                <UInput
                  v-model.number="formState.expectedInterval"
                  type="number"
                  :min="60"
                  placeholder="86400"
                  class="w-full"
                />
                <template #help>
                  Khoảng thời gian dự kiến giữa các lần ping (ví dụ: 86400 = 24 giờ).
                </template>
              </UFormField>
              <UFormField
                v-if="formState.type === 'heartbeat'"
                label="Thời gian ân hạn (giây)"
                name="gracePeriod"
              >
                <UInput
                  v-model.number="formState.gracePeriod"
                  type="number"
                  :min="0"
                  placeholder="300"
                  class="w-full"
                />
                <template #help>
                  Thời gian ân hạn sau khoảng dự kiến trước khi gửi cảnh báo (mặc định: 300 giây = 5 phút).
                </template>
              </UFormField>
              <div class="grid grid-cols-2 gap-4">
                <UFormField
                  v-if="formState.type === 'http'"
                  label="Method"
                  name="method"
                >
                  <USelectMenu
                    v-model="formState.method"
                    :items="methodOptions"
                    class="w-full"
                  />
                  <template #help>
                    Phương thức HTTP để kiểm tra endpoint
                  </template>
                </UFormField>
                <UFormField
                  label="Tần suất"
                  name="frequency"
                  :class="formState.type === 'http' ? '' : 'col-span-2'"
                >
                  <USelectMenu
                    v-model="formState.frequency"
                    :items="frequencyOptions"
                    value-key="value"
                    class="w-full"
                  />
                  <template #help>
                    Tần suất kiểm tra dịch vụ tự động
                  </template>
                </UFormField>
              </div>
            </div>
          </template>

          <template #advanced>
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
                      placeholder="Key"
                      class="flex-1 w-full"
                    />
                    <UInput
                      v-model="header.value"
                      placeholder="Value"
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
                  :placeholder="formState.httpConfig.bodyType === 'json' ? 'Nhập nội dung JSON...' : 'Nhập nội dung text...'"
                  :rows="5"
                  autoresize
                  class="w-full"
                />
              </UFormField>
            </div>
          </template>

          <template #alerts>
            <div class="space-y-4 pt-4">
              <UFormField
                label="Ngưỡng độ trễ (Latency)"
                name="alertConfig.latencyThreshold"
              >
                <UInput
                  v-model.number="formState.alertConfig.latencyThreshold"
                  type="number"
                  placeholder="Ví dụ: 2000"
                  :min="0"
                  class="w-full"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-500 dark:text-gray-400">ms</span>
                  </template>
                </UInput>
                <template #help>
                  Gửi cảnh báo nếu độ trễ vượt quá con số này (ví dụ: 2000ms = 2 giây). Để trống nếu không cần.
                </template>
              </UFormField>

              <UFormField
                label="Nội dung phản hồi (Body)"
                name="alertConfig.responseBodyCheck"
              >
                <UInput
                  v-model="formState.alertConfig.responseBodyCheck"
                  placeholder="Ví dụ: &quot;error&quot;: true"
                  class="w-full"
                />
                <template #help>
                  Gửi cảnh báo nếu nội dung (response body) chứa chuỗi này. Để trống nếu không cần.
                </template>
              </UFormField>

              <UFormField
                label="Tỷ lệ lỗi (Error Rate)"
                name="alertConfig.errorRateThreshold"
              >
                <UInput
                  v-model.number="formState.alertConfig.errorRateThreshold"
                  type="number"
                  placeholder="Ví dụ: 5"
                  :min="0"
                  :max="100"
                  class="w-full"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-500 dark:text-gray-400">%</span>
                  </template>
                </UInput>
                <template #help>
                  Gửi cảnh báo nếu tỷ lệ lỗi vượt quá % này trong 10 phút. Để trống nếu không cần. (Tính năng đang phát triển).
                </template>
              </UFormField>

              <UFormField
                label="Kênh thông báo (Webhooks)"
                name="alertConfig.channels"
              >
                <div class="space-y-2">
                  <div
                    v-for="(channel, index) in formState.alertConfig.channels"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <UInput
                      v-model="channel.url"
                      placeholder="Nhập URL (Slack, Telegram, Discord...)"
                      class="flex-1"
                    />
                    <UButton
                      icon="i-heroicons-trash"
                      color="error"
                      variant="ghost"
                      @click="removeChannel(index)"
                    />
                  </div>
                  <UButton
                    label="Thêm Webhook"
                    icon="i-heroicons-plus"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="addChannel"
                  />
                </div>
                <template #help>
                  Gửi thông báo đến các URL này khi có cảnh báo.
                </template>
              </UFormField>
            </div>
          </template>
        </UTabs>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
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

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  modelValue: boolean // v-model:open
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monitor: any | null // Monitor data để chỉnh sửa
}>()

const emit = defineEmits(['update:modelValue', 'saved'])
const toast = useToast()

const route = useRoute()
const projectId = route.params.projectId as string

const apiUrl = computed(() => {
  if (!projectId) return '' // Chưa chọn project thì không fetch
  return `/api/projects/${projectId}/monitors`
})

// === Quản lý State của Modal ===
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})
const isEditing = computed(() => !!props.monitor)

// === Logic Form ===
const formLoading = ref(false)

// (Nâng cấp) Định nghĩa Tabs
const formTabs = [
  { slot: 'basic', label: 'Cơ bản' },
  { slot: 'advanced', label: 'Nâng cao' },
  { slot: 'alerts', label: 'Cảnh báo' } // (MỚI)
]

// Các tùy chọn select
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const typeOptions = [
  { label: 'HTTP', value: 'http' },
  { label: 'Keyword', value: 'keyword' },
  { label: 'Ping', value: 'ping' },
  { label: 'Heartbeat', value: 'heartbeat' }
]
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

// (Nâng cấp) Zod Schema (Thêm alertConfig và type, keyword, heartbeat)
const formSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  type: z.enum(['http', 'keyword', 'ping', 'heartbeat']).default('http'),
  endpoint: z.string().min(1, 'Endpoint không được để trống'),
  method: z.enum(methodOptions as [string, ...string[]]).default('GET'),
  frequency: z.number().default(60),
  keyword: z.string().nullable().default(null),
  expectedInterval: z.number().min(60).nullable().default(null),
  gracePeriod: z.number().min(0).nullable().default(300),

  httpConfig: z.object({
    headers: z.array(z.object({ key: z.string().min(1), value: z.string() })).default([]),
    body: z.string().nullable().default(null),
    bodyType: z.enum(['none', 'json', 'raw']).default('none')
  }).default({ headers: [], body: null, bodyType: 'none' }),

  // (MỚI) Zod Schema cho Cảnh báo
  alertConfig: z.object({
    latencyThreshold: z.number().min(0).nullable().default(null),
    responseBodyCheck: z.string().nullable().default(null),
    errorRateThreshold: z.number().min(0).max(100).nullable().default(null),
    channels: z.array(z.object({ url: z.string().url('URL Webhook không hợp lệ') })).default([])
  }).default({ latencyThreshold: null, responseBodyCheck: null, errorRateThreshold: null, channels: [] })
})

type Schema = z.output<typeof formSchema>

// (Nâng cấp) State mặc định cho form
const defaultFormState: Schema = {
  name: '',
  type: 'http',
  endpoint: '',
  method: 'GET',
  frequency: 60,
  keyword: null,
  expectedInterval: null,
  gracePeriod: 300,
  httpConfig: { headers: [], body: null, bodyType: 'none' },
  alertConfig: { latencyThreshold: null, responseBodyCheck: null, errorRateThreshold: null, channels: [] }
}
const formState = reactive<Schema>({ ...JSON.parse(JSON.stringify(defaultFormState)) })

// (Mới) Watch prop 'monitor' để điền dữ liệu khi mở modal
watch(() => props.monitor, (newMonitor) => {
  if (isOpen.value && newMonitor) {
    // Chế độ Edit
    formState.name = newMonitor.name
    formState.type = newMonitor.type || 'http'
    formState.endpoint = newMonitor.endpoint
    formState.method = newMonitor.method
    formState.frequency = newMonitor.frequency
    formState.keyword = newMonitor.keyword || null
    formState.expectedInterval = newMonitor.expectedInterval || null
    formState.gracePeriod = newMonitor.gracePeriod || 300
    formState.httpConfig = JSON.parse(JSON.stringify(newMonitor.httpConfig || defaultFormState.httpConfig))
    // (MỚI) Điền dữ liệu alertConfig
    formState.alertConfig = JSON.parse(JSON.stringify(newMonitor.alertConfig || defaultFormState.alertConfig))
  } else {
    // Chế độ Create
    Object.assign(formState, JSON.parse(JSON.stringify(defaultFormState)))
  }
})

// === Helper cho Form ===
function addHeader() {
  formState.httpConfig.headers.push({ key: '', value: '' })
}
function removeHeader(index: number) {
  formState.httpConfig.headers.splice(index, 1)
}
// (MỚI)
function addChannel() {
  formState.alertConfig.channels.push({ url: '' })
}
function removeChannel(index: number) {
  formState.alertConfig.channels.splice(index, 1)
}

// === Hàm Submit Form (Xử lý cả Create và Edit) ===
async function onFormSubmit(event: FormSubmitEvent<Schema>) {
  formLoading.value = true
  try {
    if (isEditing.value) {
      // --- Chế độ EDIT (dùng API PUT) ---
      await $fetch(`${apiUrl.value}/${props.monitor._id}`, {
        method: 'PUT',
        body: event.data
      })
      toast.add({ title: 'Thành công', description: 'Đã cập nhật dịch vụ.' })
    } else {
      // --- Chế độ CREATE (dùng API POST) ---
      await $fetch(apiUrl.value, {
        method: 'POST',
        body: event.data
      })
      toast.add({ title: 'Thành công', description: 'Đã thêm dịch vụ.' })
    }

    isOpen.value = false // Đóng modal
    emit('saved') // Báo cho trang index.vue biết để 'refresh'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Lỗi khi submit form:', err)
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Thao tác thất bại.', color: 'error' })
  } finally {
    formLoading.value = false
  }
}
</script>
