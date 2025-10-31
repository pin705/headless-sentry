<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <!-- Left side - Brand & Features -->
    <div class="relative hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <!-- Animated background elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div class="relative z-10 w-full max-w-md">
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <UIcon name="i-lucide-activity" class="w-7 h-7 text-white" />
            </div>
            <h1 class="text-4xl font-bold tracking-tight">
              Headless Sentry
            </h1>
          </div>
          <p class="text-xl text-gray-300 leading-relaxed">
            Giám sát Uptime, Hiệu năng API & SSL cho các dịch vụ Web hiện đại.
          </p>
        </div>

        <div class="mt-12 space-y-6">
          <div class="flex gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UIcon name="i-lucide-zap" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-white mb-1">
                Giám sát Thời gian thực
              </h3>
              <p class="text-sm text-gray-400">
                Theo dõi Uptime, Latency và phát hiện lỗi ngay khi chúng xảy ra.
              </p>
            </div>
          </div>

          <div class="flex gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UIcon name="i-lucide-bell" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-white mb-1">
                Cảnh báo Thông minh
              </h3>
              <p class="text-sm text-gray-400">
                Nhận thông báo qua Slack, Telegram, Webhook khi có sự cố hoặc hiệu năng giảm sút.
              </p>
            </div>
          </div>

          <div class="flex gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-white mb-1">
                Kiểm tra SSL Tự động
              </h3>
              <p class="text-sm text-gray-400">
                Cảnh báo sớm khi chứng chỉ SSL sắp hết hạn hoặc gặp vấn đề.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login Form -->
    <div class="flex items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <UCard
        class="w-full max-w-md shadow-xl"
        :ui="{
          ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          body: { padding: 'p-6 sm:p-8' },
          header: { padding: 'p-6 sm:p-8' },
          footer: { padding: 'p-6 sm:p-8' }
        }"
      >
        <template #header>
          <div class="text-center lg:text-left">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Chào mừng trở lại!
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Đăng nhập để tiếp tục giám sát dịch vụ của bạn.
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <UButton
            block
            icon="i-simple-icons-google"
            label="Đăng nhập với Google"
            size="lg"
            color="neutral"
            variant="outline"
            @click="openInPopup('/auth/google')"
          />
          <UButton
            block
            icon="i-simple-icons-github"
            label="Đăng nhập với Github"
            size="lg"
            color="neutral"
            variant="outline"
           @click="openInPopup('/auth/github')"
          />
        </div>

        <USeparator
          label="HOẶC"
          class="my-6"
        />

        <UForm
          :state="state"
          :schema="schema"
          class="space-y-4"
          @submit="submit"
        >
          <UFormField
            label="Email"
            name="email"
            required
          >
            <UInput
              v-model="state.email"
              placeholder="you@example.com"
              icon="i-heroicons-envelope"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Mật khẩu"
            name="password"
            required
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="********"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
            <template #hint>
              <NuxtLink
                to="/quen-mat-khau"
                class="text-xs text-gray-500 dark:text-gray-400 hover:text-primary"
              >Quên mật khẩu?</NuxtLink>
            </template>
          </UFormField>
          <UButton
            type="submit"
            label="Đăng nhập"
            block
            size="lg"
            :loading="isLoading"
            color="primary"
          />
        </UForm>

        <template #footer>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Chưa có tài khoản?
              <NuxtLink
                to="/register"
                class="text-primary font-medium hover:underline"
              >Đăng ký ngay</NuxtLink>
            </p>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const { fetch, openInPopup, user } = useUserSession()
const toast = useToast()
const isLoading = ref(false)

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

// Định nghĩa schema validation bằng Zod
const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: ''
})

// Hàm xử lý khi submit form
async function submit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  try {
    await $fetch('/api/user/login', {
      method: 'POST',
      body: {
        email: event.data.email,
        password: event.data.password
      }
    })

    await fetch()

    toast.add({ title: 'Đăng nhập thành công!', color: 'success' })

    // Chuyển hướng về trang chủ sau khi đăng nhập thành công
    await navigateTo('/')
  } catch (error) {
    toast.add({
      title: 'Lỗi!',
      description: 'Email hoặc mật khẩu không đúng.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>
