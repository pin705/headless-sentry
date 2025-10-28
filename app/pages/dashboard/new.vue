<template>
  <UCard class="max-w-md mx-auto mt-10">
    <template #header>
      <h2 class="text-xl font-semibold">Thêm API Giám sát</h2>
    </template>

    <UForm :state="state" :schema="schema" @submit="onSubmit">
      <UFormGroup label="Tên gợi nhớ" name="name" class="mb-4">
        <UInput v-model="state.name" placeholder="Ví dụ: API Sản phẩm Shopify" />
      </UFormGroup>

      <UFormGroup label="Endpoint URL" name="endpoint" class="mb-4">
        <UInput v-model="state.endpoint" type="url" placeholder="https://your-api.com/endpoint" />
      </UFormGroup>

      <UButton type="submit" :loading="loading" label="Thêm Giám sát" block />
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types' // Import type từ Nuxt UI

const router = useRouter()
const toast = useToast() // Sử dụng toast của Nuxt UI
const loading = ref(false)

// Schema validation dùng Zod (đồng bộ với backend)
const schema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ')
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  endpoint: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/monitors', {
      method: 'POST',
      body: event.data // Dữ liệu đã được validate bởi UForm
    })
    toast.add({ title: 'Thành công', description: 'Đã thêm API giám sát.' })
    router.push('/dashboard') // Chuyển về trang dashboard
  } catch (err: any) {
    console.error('Lỗi khi thêm monitor:', err)
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể thêm API giám sát.', color: 'red' })
  } finally {
    loading.value = false
  }
}

// Đảm bảo trang này yêu cầu đăng nhập
definePageMeta({
  middleware: ['auth'] // Tham chiếu đến middleware/auth.ts hiện có của bạn
})
</script>
