<template>
  <UDropdownMenu
    v-if="selectedProject || loadingProjects"
    :items="dropdownItems"
    mode="hover"
    :popper="{ placement: 'bottom-start' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      :loading="loadingProjects && !selectedProject"
      class="group"
    >
      <UAvatar
        :alt="selectedProject?.name.charAt(0) || 'P'"
        size="2xs"
        class="mr-1.5"
      />

      <span class="truncate text-sm font-semibold max-w-[140px]">
        {{ selectedProject?.name || 'Đang tải...' }}
      </span>

      <UIcon
        name="i-heroicons-chevron-down"
        class="ms-1 w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200"
      />
    </UButton>

    <template #item="{ item }">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-1.5 truncate">
          <UAvatar
            v-if="item.project"
            :alt="item.project.name.charAt(0)"
            size="2xs"
          />
          <span class="truncate">{{ item.label }}</span>
        </div>
        <UIcon
          v-if="item.project?._id === selectedProject?._id"
          name="i-heroicons-check"
          class="w-4 h-4 text-primary"
        />
      </div>
    </template>
  </UDropdownMenu>

  <UButton
    v-else-if="!loadingProjects && userProjects.length === 0"
    label="Tạo Project Mới"
    icon="i-heroicons-plus"
    color="primary"
    variant="soft"
    @click="isCreateModalOpen = true"
  />

  <CreateProjectModal
    v-model="isCreateModalOpen"
    @created="onProjectCreated"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'

// Sử dụng state đã tạo
const {
  selectedProject,
  userProjects,
  loadingProjects,
  fetchUserProjects,
  selectProject
} = useProjectState()

// State cho modal tạo project
const isCreateModalOpen = ref(false)

// Gọi fetch projects khi component được mount
onMounted(() => {
  fetchUserProjects()
})

// Xây dựng items cho DropdownMenu
const dropdownItems = computed<DropdownMenuItem[][]>(() => {
  const projectItems: DropdownMenuItem[] = userProjects.value.map(project => ({
    label: project.name,
    project: project, // Lưu trữ object project
    click: () => selectProject(project)
  }))

  return [
    projectItems, // Danh sách project
    [ // Các action khác
      {
        label: 'Xem tất cả Project',
        icon: 'i-heroicons-squares-2x2',
        to: '/settings/projects' // Link đến trang quản lý project
      },
      {
        label: 'Tạo Project Mới...',
        icon: 'i-heroicons-plus-circle',
        click: () => { isCreateModalOpen.value = true }
      }
    ]
  ]
})

// (Mới) Xử lý khi tạo project thành công từ modal
async function onProjectCreated(newProject: any) {
  await fetchUserProjects() // Fetch lại danh sách
  // Tự động chọn project vừa tạo
  if (newProject && newProject._id) {
    const found = userProjects.value.find(p => p._id === newProject._id)
    if (found) {
      selectProject(found)
    }
  }
}
</script>
