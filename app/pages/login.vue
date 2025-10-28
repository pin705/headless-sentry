<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <div class="flex items-center justify-center p-4 bg-white dark:bg-gray-900">
      <UCard
        class="w-full max-w-sm"
      >
        <template #header>
          <h1

            class="text-3xl font-bold"
          >
            Chào mừng trở lại!
          </h1>
          <p

            :delay="100"
            class="text-sm text-gray-500 dark:text-gray-400 mt-1"
          >
            Đăng nhập để tiếp tục hành trình sáng tác.
          </p>
        </template>

        <div

          :delay="200"
          class="space-y-3"
        >
          <UButton
            block
            icon="i-simple-icons-google"
            color="neutral"
            @click="() => {
              toast.add({ title: 'Chức năng đang phát triển...', color: 'info' })
            }"
          >
            Đăng nhập với Google
          </UButton>
          <UButton
            block
            icon="i-simple-icons-github"
            color="neutral"
            @click="() => {
              toast.add({ title: 'Chức năng đang phát triển...', color: 'info' })
            }"
          >
            Đăng nhập với Github
          </UButton>
        </div>

        <USeparator

          :delay="300"
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

            :delay="400"
            label="Email"
            name="email"
          >
            <UInput
              v-model="state.email"
              placeholder="you@example.com"
              icon="i-heroicons-envelope"
              class="w-full"
            />
          </UFormField>
          <UFormField

            :delay="500"
            label="Mật khẩu"
            name="password"
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="********"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
          </UFormField>
          <UButton
            :delay="600"
            type="submit"
            block
            :loading="isLoading"
            color="neutral"
          >
            Đăng nhập
          </UButton>
        </UForm>

        <template #footer>
          <div

            :delay="700"
            class="text-center"
          >
            <p class="text-sm text-gray-500">
              Chưa có tài khoản?
              <NuxtLink
                to="/register"
                class="text-primary font-medium"
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

definePageMeta({
  layout: 'auth'
})

const { fetch } = useUserSession()
const toast = useToast()
const isLoading = ref(false)

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
    await navigateTo('/dashboard')
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
