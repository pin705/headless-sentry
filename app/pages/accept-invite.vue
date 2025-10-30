<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <UCard class="max-w-md w-full">
      <template #header>
        <h1 class="text-2xl font-bold text-center">
          Xác nhận lời mời
        </h1>
      </template>

      <div
        v-if="isLoading"
        class="flex flex-col items-center space-y-2"
      >
        <USpinner />
        <p>Đang xử lý...</p>
      </div>

      <UAlert
        v-else-if="errorMessage"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="errorMessage"
        class="mb-4"
      >
        <template #description>
          <NuxtLink
            v-if="isAuthError"
            to="/login"
            class="underline font-medium"
          >
            Vui lòng đăng nhập để chấp nhận.
          </NuxtLink>
        </template>
      </UAlert>

      <UAlert
        v-else-if="successMessage"
        icon="i-heroicons-check-circle"
        color="green"
        variant="soft"
        :title="successMessage"
        description="Đang chuyển hướng bạn đến dự án..."
      />

      <div
        v-else
        class="text-center space-y-4"
      >
        <p>Bạn đã được mời tham gia dự án. Bạn có muốn chấp nhận?</p>
        <UButton
          size="lg"
          class="w-full"
          @click="acceptInvite"
        >
          Chấp nhận
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false // Không sử dụng layout mặc định
})

const route = useRoute()
const token = computed(() => route.query.token)
const { session } = useAuth() // Giả định bạn dùng Nuxt Auth

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isAuthError = ref(false)

// Logic gọi API (Sử dụng API /api/project/accept-invite.post.ts đã tạo)
async function acceptInvite() {
  if (!token.value) {
    errorMessage.value = 'Token mời không hợp lệ.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  isAuthError.value = false

  try {
    const res = await $fetch('/api/project/accept-invite', {
      method: 'POST',
      body: { token: token.value }
    })

    successMessage.value = res.message || 'Chấp nhận thành công!'

    // Chuyển hướng đến project
    setTimeout(() => {
      navigateTo(`/${res.projectId}`)
    }, 2000)
  } catch (error) {
    console.error('Lỗi chấp nhận:', error)
    errorMessage.value = error.data?.message || 'Có lỗi xảy ra.'
    if (error.statusCode === 401) {
      isAuthError.value = true
    }
  } finally {
    isLoading.value = false
  }
}

// Tự động chạy khi component được mount
onMounted(() => {
  if (!token.value) {
    errorMessage.value = 'Token mời không hợp lệ hoặc bị thiếu.'
    return
  }

  if (!session.value) {
    // Nếu chưa đăng nhập, yêu cầu họ đăng nhập
    // (Lưu ý: Bạn cần logic để lưu token và redirect lại sau)
    errorMessage.value = 'Bạn cần đăng nhập để chấp nhận lời mời.'
    isAuthError.value = true
    // Tùy chọn: Tự động chuyển đến trang login
    // return navigateTo(`/login?redirect=/accept-invite?token=${token.value}`)
  } else {
    // Nếu đã đăng nhập và có token, tự động chấp nhận
    acceptInvite()
  }
})
</script>
