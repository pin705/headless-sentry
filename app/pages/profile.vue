<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cài đặt Tài khoản">
        <template #description>
          Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTabs
        :items="tabItems"
        orientation="vertical"
      >
        <template #profile="{ item }">
          <UCard
            :ui="{
              body: { padding: 'p-6' },
              ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
            }"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-user"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ item.label }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Cập nhật thông tin cá nhân của bạn
                  </p>
                </div>
              </div>
            </template>

            <UForm
              :schema="profileSchema"
              :state="profileState"
              class="space-y-6"
              @submit="handleUpdateProfile"
            >
              <UFormField
                label="Ảnh đại diện"
                name="avatarUrl"
                class="max-w-lg"
              >
                <div class="flex items-center gap-4">
                  <UAvatar
                    :src="previewUrl || session?.user?.avatarUrl || defaultAvatar"
                    size="xl"
                    alt="Avatar"
                  />
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="onFileChange"
                  >
                  <div class="flex flex-col gap-2">
                    <UButton
                      label="Thay đổi"
                      icon="i-lucide-upload"
                      variant="outline"
                      color="neutral"
                      @click="fileInputRef?.click()"
                    />
                    <UButton
                      label="Xoá"
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="outline"
                      :disabled="!profileState.avatarUrl && !previewUrl"
                      @click="handleRemoveAvatar"
                    />
                  </div>
                </div>
              </UFormField>

              <UFormField
                label="Email"
                name="email"
                class="max-w-lg"
              >
                <UInput
                  v-model="profileState.email"
                  disabled
                  icon="i-lucide-mail"
                />
              </UFormField>

              <UFormField
                label="Tên hiển thị"
                name="name"
                class="max-w-lg"
              >
                <UInput
                  v-model="profileState.name"
                  icon="i-lucide-user"
                />
              </UFormField>

              <div class="flex items-center gap-3 pt-4">
                <UButton
                  type="submit"
                  icon="i-lucide-save"
                  :loading="isProfileLoading"
                  color="primary"
                >
                  Lưu thay đổi
                </UButton>
              </div>
            </UForm>
          </UCard>
        </template>

        <template #security="{ item }">
          <UCard
            :ui="{
              body: { padding: 'p-6' },
              ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
            }"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-shield"
                    class="w-5 h-5 text-warning-600 dark:text-warning-400"
                  />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ item.label }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Thay đổi mật khẩu và bảo vệ tài khoản
                  </p>
                </div>
              </div>
            </template>

            <UForm
              :schema="securitySchema"
              :state="securityState"
              class="space-y-6 max-w-lg"
              @submit="handleChangePassword"
            >
              <UFormField
                label="Mật khẩu hiện tại"
                name="currentPassword"
              >
                <UInput
                  v-model="securityState.currentPassword"
                  type="password"
                  icon="i-lucide-lock"
                />
              </UFormField>

              <UFormField
                label="Mật khẩu mới"
                name="newPassword"
              >
                <UInput
                  v-model="securityState.newPassword"
                  type="password"
                  icon="i-lucide-key"
                />
              </UFormField>

              <UFormField
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
              >
                <UInput
                  v-model="securityState.confirmPassword"
                  type="password"
                  icon="i-lucide-check"
                />
              </UFormField>

              <div class="flex items-center gap-3 pt-4">
                <UButton
                  type="submit"
                  icon="i-lucide-shield-check"
                  :loading="isSecurityLoading"
                  color="primary"
                >
                  Đổi mật khẩu
                </UButton>
              </div>
            </UForm>
          </UCard>
        </template>
      </UTabs>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { z } from 'zod'

const { session, fetch: refreshSession } = useUserSession()
const toast = useToast()
useHead({
  title: 'Cài đặt tài khoản'
})

// Ảnh avatar mặc định nếu user chưa có
const defaultAvatar = 'https://i.pravatar.cc/150'

// Định nghĩa các tab cho UTabs với icon
const tabItems = [
  { slot: 'profile', label: 'Hồ sơ cá nhân', icon: 'i-lucide-user' },
  { slot: 'security', label: 'Bảo mật', icon: 'i-lucide-shield' }
]

// --- 1. Logic cho Profile (Đã cập nhật) ---
const profileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên quá dài'),
  email: z.string().email()
})

const profileState = ref({
  email: '',
  name: '',
  avatarUrl: ''
})
const isProfileLoading = ref(false)

// Logic cho Avatar Upload (Giữ nguyên)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const avatarAction = ref<'upload' | 'remove' | 'none'>('none')

watch(session, (newSession) => {
  profileState.value.email = newSession?.user?.email || ''
  profileState.value.name = newSession?.user?.name || ''
  profileState.value.avatarUrl = newSession?.user?.avatarUrl || ''
}, { immediate: true })

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    selectedFile.value = file
    avatarAction.value = 'upload'
    previewUrl.value = URL.createObjectURL(file)
  }
}

function handleRemoveAvatar() {
  selectedFile.value = null
  previewUrl.value = null
  avatarAction.value = 'remove'
  profileState.value.avatarUrl = ''
}

// ⭐️ HÀM NÀY ĐÃ THAY ĐỔI HOÀN TOÀN ⭐️
async function handleUpdateProfile() {
  isProfileLoading.value = true
  let finalAvatarUrl: string | null = null // URL để lưu vào CSDL

  try {
    // --- BƯỚC 1: XỬ LÝ UPLOAD NẾU CÓ FILE MỚI ---
    if (avatarAction.value === 'upload' && selectedFile.value) {
      // 1a. Lấy Pre-signed URL từ API của bạn
      const { uploadUrl, publicUrl } = await $fetch('/api/upload/presigned-url', {
        method: 'POST',
        body: {
          fileName: selectedFile.value.name,
          fileType: selectedFile.value.type
        }
      })

      // 1b. Dùng URL đó để TẢI FILE THẲNG LÊN R2 (Cloudflare)
      // Quan trọng: Dùng method 'PUT' và gửi file thô (raw file)
      await $fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile.value,
        headers: {
          'Content-Type': selectedFile.value.type // Phải có header này
        }
      })

      // 1c. Lưu lại publicUrl để gửi cho API profile
      finalAvatarUrl = publicUrl
    }

    // --- BƯỚC 2: TẠO BODY VÀ GỌI API PROFILE ---
    // API này bây giờ nhận JSON, KHÔNG phải FormData
    const profileBody: Record<string, unknown> = {
      name: profileState.value.name
    }

    if (avatarAction.value === 'upload' && finalAvatarUrl) {
      profileBody.avatarUrl = finalAvatarUrl // Gửi URL mới
    } else if (avatarAction.value === 'remove') {
      profileBody.removeAvatar = true // Gửi cờ 'xóa'
    }

    // 3. Gọi API [PUT] /api/user/profile với JSON body
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: profileBody
    })

    // --- BƯỚC 3: DỌN DẸP ---
    await refreshSession()
    selectedFile.value = null
    previewUrl.value = null
    avatarAction.value = 'none'

    toast.add({
      title: 'Thành công',
      description: 'Đã cập nhật thông tin của bạn.',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: unknown) {
    console.error(error)
    const errorMessage = error && typeof error === 'object' && 'data' in error
      ? ((error as { data?: { message?: string } }).data?.message)
      : undefined
    toast.add({
      title: 'Lỗi',
      description: errorMessage || 'Không thể cập nhật',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isProfileLoading.value = false
  }
}

// --- 2. Logic cho Security (Bảo mật) ---
const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
})

const securityState = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const isSecurityLoading = ref(false)

async function handleChangePassword() {
  isSecurityLoading.value = true
  try {
    // Gọi API [POST] /api/user/change-password
    await $fetch('/api/user/change-password', {
      method: 'POST',
      body: {
        currentPassword: securityState.value.currentPassword,
        newPassword: securityState.value.newPassword
      }
    })

    toast.add({
      title: 'Thành công',
      description: 'Đã đổi mật khẩu.',
      icon: 'i-lucide-check-circle'
    })

    // Reset form
    securityState.value.currentPassword = ''
    securityState.value.newPassword = ''
    securityState.value.confirmPassword = ''
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'data' in error
      ? ((error as { data?: { message?: string } }).data?.message)
      : undefined
    toast.add({
      title: 'Lỗi',
      description: errorMessage || 'Không thể đổi mật khẩu',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSecurityLoading.value = false
  }
}
</script>
