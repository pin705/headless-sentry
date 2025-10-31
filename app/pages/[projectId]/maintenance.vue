<template>
  <div>
    <UDashboardPanel id="maintenance">
      <template #header>
        <UDashboardNavbar title="Cửa sổ Bảo trì">
          <template #right>
            <UButton
              label="Thêm Bảo trì"
              icon="i-heroicons-plus"
              @click="openCreateModal"
            />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6">
          <div
            v-if="pending"
            class="flex items-center justify-center h-64"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-gray-500 w-8 h-8"
            />
          </div>

          <div
            v-else-if="error"
            class="text-error-500"
          >
            Không thể tải danh sách bảo trì.
          </div>

          <div
            v-else-if="windows && windows.length === 0"
            class="text-center py-12"
          >
            <UIcon
              name="i-heroicons-calendar"
              class="w-16 h-16 mx-auto text-gray-400 mb-4"
            />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chưa có cửa sổ bảo trì
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Tạo cửa sổ bảo trì để tạm dừng cảnh báo trong thời gian bảo trì dịch vụ.
            </p>
            <UButton
              label="Thêm Bảo trì"
              @click="openCreateModal"
            />
          </div>

          <div
            v-else
            class="space-y-4"
          >
            <UCard
              v-for="window in windows"
              :key="window._id"
              class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="text-lg font-semibold">
                      {{ window.name }}
                    </h3>
                    <UBadge
                      :color="window.isActive ? 'success' : 'neutral'"
                      variant="subtle"
                    >
                      {{ window.isActive ? 'Đang hoạt động' : 'Tạm dừng' }}
                    </UBadge>
                    <UBadge
                      :color="window.type === 'one-time' ? 'primary' : 'secondary'"
                      variant="subtle"
                    >
                      {{ window.type === 'one-time' ? 'Một lần' : 'Định kỳ' }}
                    </UBadge>
                  </div>

                  <p
                    v-if="window.description"
                    class="text-gray-600 dark:text-gray-400 mb-3"
                  >
                    {{ window.description }}
                  </p>

                  <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <div v-if="window.type === 'one-time'">
                      <strong>Thời gian:</strong> {{ formatDateTime(window.startTime) }} - {{ formatDateTime(window.endTime) }}
                    </div>
                    <div v-else>
                      <strong>Lịch trình:</strong> {{ window.cronSchedule }} ({{ window.duration }} phút)
                    </div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <UButton
                    icon="i-heroicons-pencil"
                    variant="ghost"
                    color="neutral"
                    @click="editWindow(window)"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    variant="ghost"
                    color="error"
                    @click="deleteWindow(window._id)"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </UDashboardPanel>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #header>
        <h2 class="text-xl font-semibold">
          {{ editingWindow ? 'Chỉnh sửa' : 'Thêm' }} Cửa sổ Bảo trì
        </h2>
      </template>

      <template #body>
        <UForm
          :state="formState"
          @submit="onSubmit"
        >
          <div class="space-y-4">
            <UFormField
              label="Tên"
              name="name"
              required
            >
              <UInput
                v-model="formState.name"
                placeholder="Ví dụ: Bảo trì định kỳ cuối tuần"
              />
            </UFormField>

            <UFormField
              label="Mô tả"
              name="description"
            >
              <UTextarea
                v-model="formState.description"
                placeholder="Mô tả chi tiết về bảo trì"
                :rows="3"
              />
            </UFormField>

            <UFormField
              label="Loại"
              name="type"
              required
            >
              <USelectMenu
                v-model="formState.type"
                :items="typeOptions"
                value-key="value"
              />
            </UFormField>

            <div v-if="formState.type === 'one-time'">
              <UFormField
                label="Thời gian bắt đầu"
                name="startTime"
                required
              >
                <UInput
                  v-model="formState.startTime"
                  type="datetime-local"
                />
              </UFormField>

              <UFormField
                label="Thời gian kết thúc"
                name="endTime"
                required
                class="mt-4"
              >
                <UInput
                  v-model="formState.endTime"
                  type="datetime-local"
                />
              </UFormField>
            </div>

            <div v-else>
              <UFormField
                label="Lịch trình Cron"
                name="cronSchedule"
                required
              >
                <UInput
                  v-model="formState.cronSchedule"
                  placeholder="0 2 * * 0"
                />
                <template #help>
                  Ví dụ: "0 2 * * 0" = 2:00 AM mỗi Chủ nhật. <a
                    href="https://crontab.guru"
                    target="_blank"
                    class="text-primary underline"
                  >Tìm hiểu thêm</a>
                </template>
              </UFormField>

              <UFormField
                label="Thời lượng (phút)"
                name="duration"
                required
                class="mt-4"
              >
                <UInput
                  v-model.number="formState.duration"
                  type="number"
                  :min="1"
                  placeholder="60"
                />
              </UFormField>
            </div>

            <UFormField
              label="Trạng thái"
              name="isActive"
            >
              <UToggle v-model="formState.isActive" />
              <template #help>
                {{ formState.isActive ? 'Đang hoạt động' : 'Tạm dừng' }}
              </template>
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isModalOpen = false"
            >
              Hủy
            </UButton>
            <UButton
              type="submit"
              :loading="formLoading"
            >
              {{ editingWindow ? 'Cập nhật' : 'Tạo' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const route = useRoute()
const toast = useToast()
const projectId = route.params.projectId as string

// Fetch maintenance windows
const { data: windows, pending, error, refresh } = await useFetch(`/api/projects/${projectId}/maintenance`)

// Modal state
const isModalOpen = ref(false)
const editingWindow = ref(null)
const formLoading = ref(false)

const typeOptions = [
  { label: 'Một lần', value: 'one-time' },
  { label: 'Định kỳ', value: 'recurring' }
]

const defaultFormState = {
  name: '',
  description: null,
  type: 'one-time',
  startTime: null,
  endTime: null,
  cronSchedule: null,
  duration: 60,
  isActive: true
}

const formState = reactive({ ...defaultFormState })

function openCreateModal() {
  editingWindow.value = null
  Object.assign(formState, defaultFormState)
  isModalOpen.value = true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function editWindow(window: any) {
  editingWindow.value = window
  formState.name = window.name
  formState.description = window.description
  formState.type = window.type
  formState.startTime = window.startTime ? new Date(window.startTime).toISOString().slice(0, 16) : null
  formState.endTime = window.endTime ? new Date(window.endTime).toISOString().slice(0, 16) : null
  formState.cronSchedule = window.cronSchedule
  formState.duration = window.duration
  formState.isActive = window.isActive
  isModalOpen.value = true
}

async function onSubmit() {
  formLoading.value = true
  try {
    const payload = {
      name: formState.name,
      description: formState.description,
      type: formState.type,
      startTime: formState.type === 'one-time' ? formState.startTime : null,
      endTime: formState.type === 'one-time' ? formState.endTime : null,
      cronSchedule: formState.type === 'recurring' ? formState.cronSchedule : null,
      duration: formState.type === 'recurring' ? formState.duration : null,
      isActive: formState.isActive
    }

    if (editingWindow.value) {
      await $fetch(`/api/projects/${projectId}/maintenance/${editingWindow.value._id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({ title: 'Thành công', description: 'Đã cập nhật cửa sổ bảo trì.' })
    } else {
      await $fetch(`/api/projects/${projectId}/maintenance`, {
        method: 'POST',
        body: payload
      })
      toast.add({ title: 'Thành công', description: 'Đã tạo cửa sổ bảo trì.' })
    }

    isModalOpen.value = false
    refresh()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Lỗi khi submit form:', err)
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Thao tác thất bại.', color: 'error' })
  } finally {
    formLoading.value = false
  }
}

async function deleteWindow(windowId: string) {
  if (!confirm('Bạn có chắc muốn xóa cửa sổ bảo trì này?')) return

  try {
    await $fetch(`/api/projects/${projectId}/maintenance/${windowId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Thành công', description: 'Đã xóa cửa sổ bảo trì.' })
    refresh()
  } catch (err) {
    console.error('Lỗi khi xóa:', err)
    toast.add({ title: 'Lỗi', description: 'Không thể xóa cửa sổ bảo trì.', color: 'error' })
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('vi-VN')
}
</script>
