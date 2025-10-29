<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h2 class="text-xl font-semibold">
        Tạo Project Mới
      </h2>
    </template>

    <template #body>
      <UForm
        :state="state"
        :schema="schema"
        @submit="onSubmit"
      >
        <UFormField
          label="Tên Project"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Tên dự án của bạn"
          />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          >
            Hủy
          </UButton>
          <UButton
            type="submit"
            :loading="loading"
            label="Tạo Project"
            color="primary"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  modelValue: boolean // v-model:open
}>()

const emit = defineEmits(['update:modelValue', 'created'])
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const loading = ref(false)
const schema = z.object({
  name: z.string().min(1, 'Tên Project không được để trống').max(100)
})
type Schema = z.output<typeof schema>
const state = reactive<Schema>({ name: '' })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    // Gọi API tạo Project
    const newProject = await $fetch('/api/projects', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Thành công', description: `Đã tạo Project "${newProject.name}".`, color: 'success' })
    isOpen.value = false // Đóng modal
    emit('created', newProject) // Gửi sự kiện tạo thành công kèm data project mới
    state.name = '' // Reset form
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể tạo Project.', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
