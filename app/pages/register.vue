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
                Bắt đầu Miễn phí
              </h3>
              <p class="text-sm text-gray-400">
                Không cần thẻ tín dụng. Gói Free với đầy đủ tính năng cơ bản.
              </p>
            </div>
          </div>

          <div class="flex gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UIcon name="i-lucide-gauge" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-white mb-1">
                Thiết lập trong 5 phút
              </h3>
              <p class="text-sm text-gray-400">
                Giao diện đơn giản, dễ sử dụng. Bắt đầu giám sát ngay lập tức.
              </p>
            </div>
          </div>

          <div class="flex gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-white mb-1">
                Nâng cấp Linh hoạt
              </h3>
              <p class="text-sm text-gray-400">
                Nâng cấp lên gói Pro khi cần nhiều tính năng hơn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Register Form -->
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
              Bắt đầu Miễn phí
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Tạo tài khoản để theo dõi hiệu năng dịch vụ của bạn.
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <UButton
            block
            icon="i-simple-icons-google"
            label="Tiếp tục với Google"
            size="lg"
            color="neutral"
            variant="outline"
            @click="() => {
              toast.add({ title: 'Chức năng đang phát triển...', color: 'info' })
            }"
          />
          <UButton
            block
            icon="i-simple-icons-github"
            label="Tiếp tục với Github"
            size="lg"
            color="neutral"
            variant="outline"
            @click="() => {
              toast.add({ title: 'Chức năng đang phát triển...', color: 'info' })
            }"
          />
        </div>

        <USeparator
          label="HOẶC ĐĂNG KÝ BẰNG EMAIL"
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
              placeholder="Ít nhất 6 ký tự"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Xác nhận mật khẩu"
            name="passwordConfirm"
            required
          >
            <UInput
              v-model="state.passwordConfirm"
              type="password"
              placeholder="Nhập lại mật khẩu"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            label="Tạo tài khoản"
            block
            size="lg"
            :loading="isLoading"
            color="primary"
          />
        </UForm>

        <template #footer>
          <div
            class="text-center"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Đã có tài khoản?
              <NuxtLink
                to="/login"
                class="text-primary font-medium hover:underline"
              >Đăng nhập ngay</NuxtLink>
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

definePageMeta({
  layout: 'auth'
})

const toast = useToast()
const isLoading = ref(false)

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  passwordConfirm: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
}).refine(data => data.password === data.passwordConfirm, {
  message: 'Mật khẩu không khớp',
  path: ['passwordConfirm'] // Hiển thị lỗi ở trường xác nhận mật khẩu
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: '',
  passwordConfirm: ''
})

async function submit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  try {
    await $fetch('/api/user/register', {
      method: 'POST',
      body: {
        email: event.data.email,
        password: event.data.password
      }
    })

    toast.add({ title: 'Đăng ký thành công!', description: 'Bây giờ bạn có thể đăng nhập.', color: 'success' })
    await navigateTo('/login')
  } catch (error: any) {
    toast.add({ title: 'Lỗi!', description: error.data?.statusMessage || 'Đã có lỗi xảy ra', color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>
