<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cấu hình chung" />
    </template>
    <template #body>
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Thông tin chung
          </h2>
        </template>

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="handleUpdateProject"
        >
          <UFormField
            label="Tên dự án"
            name="name"
          >
            <UInput v-model="state.name" />
          </UFormField>

          <UButton
            type="submit"
            :loading="isUpdating"
          >
            Lưu thay đổi
          </UButton>
        </UForm>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { z } from 'zod'

const route = useRoute()
const toast = useToast()
const { project, refreshProject } = useProjectState() // Giả định bạn có composable này
const projectId = computed(() => route.params.projectId)

// Validation schema
const schema = z.object({
  name: z.string().min(3, 'Tên phải có ít nhất 3 ký tự')
})

const state = ref({
  name: ''
})

const isUpdating = ref(false)

// Đồng bộ state với data từ composable
watch(project, (newProject) => {
  if (newProject) {
    state.value.name = newProject.name
  }
}, { immediate: true })

// Logic cập nhật
async function handleUpdateProject() {
  isUpdating.value = true
  try {
    await $fetch(`/api/projects/${projectId.value}`, {
      method: 'PUT',
      body: state.value
    })
    toast.add({ title: 'Cập nhật thành công!', icon: 'i-heroicons-check-circle' })
    await refreshProject() // Tải lại state project (nếu cần)
  } catch (error) {
    console.error('Lỗi cập nhật:', error)
    toast.add({
      title: 'Lỗi',
      description: error.data?.message || 'Không thể cập nhật',
      color: 'red',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    isUpdating.value = false
  }
}
</script>
