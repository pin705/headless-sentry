<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cấu hình chung" />
    </template>
    <template #body>
      <div v-if="pending" class="p-4">
        <USkeleton class="h-12 w-1/2 mb-4" />
        <USkeleton class="h-32 w-full" />
      </div>

      <UCard v-else>
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
// Sửa lại để sử dụng đúng tên từ composable
const { selectedProject, selectProject } = useProjectState()

const projectId = computed(() => route.params.projectId)

// Validation schema
const schema = z.object({
  name: z.string().min(3, 'Tên phải có ít nhất 3 ký tự')
})

const state = ref({
  name: ''
})

const isUpdating = ref(false)

// --- PHẦN BỔ SUNG: Lấy dữ liệu dự án khi tải trang ---
// Sử dụng API GET /api/projects/[projectId]/index.get.ts]
const { data: fetchedProject, pending, refresh: refreshFetchedProject } = await useFetch(
  () => `/api/projects/${projectId.value}`,
  {
    onSuccess: (data) => {
      if (data) {
        state.value.name = data.name
        // Cập nhật trạng thái toàn cục
        selectProject(data)
      }
    },
    // Nếu selectedProject đã có, dùng nó làm giá trị ban đầu
    // watch ở dưới sẽ cập nhật state.name
    default: () => selectedProject.value
  }
)

// Đồng bộ state với data từ composable (nếu nó thay đổi)
watch(selectedProject, (newProject) => {
  if (newProject && newProject.name !== state.value.name) {
    state.value.name = newProject.name
  }
}, { immediate: true })

// Logic cập nhật
async function handleUpdateProject() {
  isUpdating.value = true
  try {
    // Gọi API PUT /api/projects/[projectId]/index.put.ts]
    const updatedProject = await $fetch(`/api/projects/${projectId.value}`, {
      method: 'PUT',
      body: state.value
    })

    toast.add({ title: 'Cập nhật thành công!', icon: 'i-heroicons-check-circle' })

    // Cập nhật lại state toàn cục
    selectProject(updatedProject)
    // Bạn cũng có thể gọi refreshFetchedProject() nếu cần

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
