<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <div class="relative hidden lg:flex flex-col items-center justify-center p-12 bg-gray-900 text-white overflow-hidden">
      <div class="relative z-10 w-full max-w-md">
        <h1 class="text-5xl font-bold tracking-tighter text-primary">
          Headless Sentry
        </h1>
        <p class="mt-4 text-lg text-gray-300">
          Giám sát Uptime, Hiệu năng API & SSL cho các dịch vụ Web hiện đại.
        </p>

        <div class="mt-10 space-y-6 border-l-2 border-primary pl-6">
          <div class="space-y-1">
            <h3 class="font-semibold">
              Giám sát Thời gian thực
            </h3>
            <p class="text-sm text-gray-400">
              Theo dõi Uptime, Latency và phát hiện lỗi ngay khi chúng xảy ra.
            </p>
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold">
              Cảnh báo Thông minh
            </h3>
            <p class="text-sm text-gray-400">
              Nhận thông báo qua Slack, Telegram..., Webhook khi có sự cố hoặc hiệu năng giảm sút.
            </p>
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold">
              Kiểm tra SSL Tự động
            </h3>
            <p class="text-sm text-gray-400">
              Cảnh báo sớm khi chứng chỉ SSL sắp hết hạn hoặc gặp vấn đề.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center p-4 bg-white dark:bg-gray-950">
      <UCard
        class="w-full max-w-sm"
        :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }"
      >
        <template #header>
          <h1 class="text-3xl font-bold">
            Chào mừng trở lại!
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Đăng nhập để tiếp tục giám sát dịch vụ của bạn.
          </p>
        </template>

        <div class="space-y-3">
          <UButton
            block
            icon="i-simple-icons-google"
            label="Đăng nhập với Google"
            color="neutral"
            variant="outline"
            @click="openInPopup('/auth/google')"
          />
          <UButton
            block
            icon="i-simple-icons-github"
            label="Đăng nhập với Github"
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
