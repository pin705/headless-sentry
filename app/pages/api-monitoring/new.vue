<template>
  <UCard class="max-w-xl mx-auto mt-10">
    <template #header>
      <h2 class="text-xl font-semibold">Thêm API Giám sát mới</h2>
    </template>

    <UForm :state="state" :schema="schema" @submit="onSubmit" class="space-y-4">
      <UFormField label="Tên gợi nhớ" name="name">
        <UInput v-model="state.name" placeholder="Ví dụ: API Sản phẩm Shopify" />
      </UFormField>

      <UFormField label="Endpoint URL" name="endpoint">
        <UInput v-model="state.endpoint" type="url" placeholder="https://your-api.com/endpoint" />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Method" name="method">
          <USelect v-model="state.method" :options="methodOptions" />
        </UFormField>

        <UFormField label="Tần suất" name="frequency">
          <USelect v-model.number="state.frequency" :options="frequencyOptions" />
        </UFormField>
      </div>

      <div class="pt-4">
        <UButton type="submit" :loading="loading" label="Thêm Giám sát" block />
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const router = useRouter()
const toast = useToast()
const loading = ref(false)

// Các tùy chọn phải khớp với backend
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const frequencyOptions = [
  { label: 'Mỗi 1 phút', value: 60 },
  { label: 'Mỗi 5 phút', value: 300 },
  { label: 'Mỗi 10 phút', value: 600 },
  { label: 'Mỗi 30 phút', value: 1800 },
  { label: 'Mỗi 1 giờ', value: 3600 },
]

// Schema validation dùng Zod
const schema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ'),
  method: z.enum(methodOptions as [string, ...string[]]).default('GET'),
  frequency: z.number().default(60)
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  endpoint: '',
  method: 'GET',
  frequency: 60
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/monitors', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Thành công', description: 'Đã thêm API giám sát.' })
    router.push('/dashboard')
  } catch (err: any) {
    console.error('Lỗi khi thêm monitor:', err)
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể thêm API giám sát.', color: 'red' })
  } finally {
    loading.value = false
  }
}
</script>
