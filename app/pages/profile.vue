<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cài đặt Tài khoản" />
    </template>

    <template #body>
      <UTabs
        :items="tabItems"
        orientation="vertical"
      >
        <template #profile="{ item }">
          <div class="p-4 space-y-6">
            <h3 class="text-lg font-semibold">
              {{ item.label }}
            </h3>
            <UForm
              :schema="profileSchema"
              :state="profileState"
              class="space-y-4"
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
                      @click="fileInputRef?.click()"
                    />
                    <UButton
                      label="Xoá"
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
                  icon="i-heroicons-envelope"
                />
              </UFormField>

              <UFormField
                label="Tên hiển thị"
                name="name"
                class="max-w-lg"
              >
                <UInput
                  v-model="profileState.name"
                  icon="i-heroicons-user"
                />
              </UFormField>

              <UButton
                type="submit"
                :loading="isProfileLoading"
              >
                Lưu thay đổi
              </UButton>
            </UForm>
          </div>
        </template>

        <template #security="{ item }">
          <div class="p-4 space-y-6">
            <h3 class="text-lg font-semibold">
              {{ item.label }}
            </h3>
            <UForm
              :schema="securitySchema"
              :state="securityState"
              class="space-y-4 max-w-lg"
              @submit="handleChangePassword"
            >
              <UFormField
                label="Mật khẩu hiện tại"
                name="currentPassword"
              >
                <UInput
                  v-model="securityState.currentPassword"
                  type="password"
                />
              </UFormField>

              <UFormField
                label="Mật khẩu mới"
                name="newPassword"
              >
                <UInput
                  v-model="securityState.newPassword"
                  type="password"
                />
              </UFormField>

              <UFormField
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
              >
                <UInput
                  v-model="securityState.confirmPassword"
                  type="password"
                />
              </UFormField>

              <UButton
                type="submit"
                :loading="isSecurityLoading"
              >
                Đổi mật khẩu
              </UButton>
            </UForm>
          </div>
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

// Định nghĩa các tab cho UTabs (Giữ nguyên)
const tabItems = [
  { slot: 'profile', label: 'Hồ sơ cá nhân' },
  { slot: 'security', label: 'Bảo mật' }
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
          'Content-Type': selectedFile.value.type, // Phải có header này
        }
      })

      // 1c. Lưu lại publicUrl để gửi cho API profile
      finalAvatarUrl = publicUrl
    }

    // --- BƯỚC 2: TẠO BODY VÀ GỌI API PROFILE ---
    // API này bây giờ nhận JSON, KHÔNG phải FormData
    const profileBody: any = {
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
      icon: 'i-heroicons-check-circle'
    })
  } catch (error: any) {
    console.error(error)
    toast.add({
      title: 'Lỗi',
      description: error.data?.message || 'Không thể cập nhật',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    isProfileLoading.value = false
  }
}

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
      icon: 'i-heroicons-check-circle'
    })

    // Reset form
    securityState.value.currentPassword = ''
    securityState.value.newPassword = ''
    securityState.value.confirmPassword = ''
  } catch (error: any) {
    toast.add({
      title: 'Lỗi',
      description: error.data?.message || 'Không thể đổi mật khẩu',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    isSecurityLoading.value = false
  }
}
</script>
