<template>
  <div>
    <h2 class="text-xl font-semibold border-b pb-2">Thông tin chung</h2>
    <form @submit.prevent="handleUpdateProject" class="mt-4 space-y-4">
      <div>
        <label for="projectName" class="block font-medium">Tên dự án</label>
        <input
          id="projectName"
          v-model="form.name"
          type="text"
          class="border w-full p-2 rounded-md"
        />
      </div>
      <div>
        <label for="projectDesc" class="block font-medium">Mô tả</label>
        <textarea
          id="projectDesc"
          v-model="form.description"
          rows="3"
          class="border w-full p-2 rounded-md"
        ></textarea>
      </div>

      <button
        type="submit"
        :disabled="isUpdating"
        class="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {{ isUpdating ? 'Đang lưu...' : 'Lưu thay đổi' }}
      </button>
    </form>
  </div>
</template>

<script setup>
const route = useRoute()
const projectId = computed(() => route.params.id)

// Lấy dữ liệu đã được fetch từ layout cha (settings.vue)
// `useNuxtData` giúp lấy data từ cache mà không cần fetch lại
const { data: project } = useNuxtData(`project-${projectId.value}`)

const form = ref({
  name: project.value?.name || '',
  description: project.value?.description || '',
})

const isUpdating = ref(false)

async function handleUpdateProject() {
  isUpdating.value = true
  try {
    const updatedProject = await $fetch(`/api/projects/${projectId.value}`, {
      method: 'PATCH', // Hoặc PUT
      body: form.value,
    })

    // Cập nhật lại cache của useNuxtData (quan trọng)
    project.value = updatedProject

    alert('Cập nhật thành công!')
  } catch (error) {
    console.error('Lỗi cập nhật:', error)
    alert('Có lỗi xảy ra!')
  } finally {
    isUpdating.value = false
  }
}
</script>
