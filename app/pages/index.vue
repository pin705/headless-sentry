<template>
  <UDashboardPanel id="projects-list">
    <template #header>
      <UDashboardNavbar title="Quản lý Projects">
        <template #right>
          <div class="flex items-center gap-4">
            <UButton
              :icon="loadingProjects ? 'i-heroicons-arrow-path-solid' : 'i-heroicons-arrow-path'"
              :loading="loadingProjects"
              variant="ghost"
              color="neutral"
              aria-label="Làm mới"
              @click="refreshProjects"
            />
            <UButton
              icon="i-heroicons-plus-solid"
              label="Tạo Project Mới"
              color="primary"
              @click="isCreateModalOpen = true"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="loadingProjects"
        class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-28"
        />
      </div>

      <div
        v-else-if="userProjects.length === 0"
        class="p-4 text-center text-gray-500 dark:text-gray-400"
      >
        <UIcon
          name="i-heroicons-folder-open"
          class="w-12 h-12 mx-auto mb-2"
        />
        <p>Bạn chưa tham gia Project nào.</p>
        <UButton
          label="Tạo Project đầu tiên"
          icon="i-heroicons-plus"
          color="primary"
          variant="soft"
          class="mt-4"
          @click="isCreateModalOpen = true"
        />
      </div>

      <div
        v-else
        class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard
          v-for="project in userProjects"
          :key="project._id"
          class="hover:ring-2 hover:ring-primary-500 dark:hover:ring-primary-400 cursor-pointer transition-shadow duration-200"
          :ui="{ body: { padding: 'p-4' }, ring: 'ring-1 ring-gray-200 dark:ring-gray-800' }"
          @click.stop="navigateToProject(project._id)"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-lg truncate">{{ project.name }}</span>
              <UBadge
                v-if="project.ownerId === currentUser?.userId"
                label="Owner"
                color="primary"
                variant="soft"
                size="xs"
              />
            </div>

            <UDropdownMenu
              :items="getActionItems(project)"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                icon="i-heroicons-ellipsis-horizontal-20-solid"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                @click.stop
              />
            </UDropdownMenu>
          </div>
        </UCard>
      </div>

      <UModal v-model:open="isDeleteModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold">
            Xác nhận Xóa Project
          </h3>
        </template>
        <template #body>
          <p>Bạn có chắc chắn muốn xóa Project <strong>{{ projectToDelete?.name }}</strong> không? Tất cả Monitors và dữ liệu liên quan cũng sẽ bị xóa vĩnh viễn.</p>
          <p class="mt-2 text-sm text-warning-500">
            Hành động này không thể hoàn tác.
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isDeleteModalOpen = false"
            >
              Hủy
            </UButton>
            <UButton
              color="error"
              :loading="deleteLoading"
              @click="confirmDelete"
            >
              Xác nhận Xóa
            </UButton>
          </div>
        </template>
      </UModal>

      <CreateProjectModal
        v-model="isCreateModalOpen"
        @created="onProjectCreated"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const toast = useToast()
const { user: currentUser } = useUserSession()
const { userProjects, loadingProjects, fetchUserProjects, selectProject, selectedProject } = useProjectState() // Added selectedProject

// Fetch projects on mount
onMounted(() => {
  fetchUserProjects()
})

// === Actions Logic ===
const UDropdownMenu = resolveComponent('UDropdownMenu') // (Rule 4)
const UButton = resolveComponent('UButton')
// const UBadge = resolveComponent('UBadge') // If UBadge is used in render functions

// Modal Delete state
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const projectToDelete = ref<any>(null) // Store the whole project object

// (Rule 3) Define Actions Items based on role (currently just Owner check)
const getActionItems = (project: any): DropdownMenuItem[][] => {
  const isOwner = project.ownerId === currentUser.value?.userId

  const items: DropdownMenuItem[][] = [[
    {
      label: 'Cài đặt Project',
      icon: 'i-heroicons-cog-6-tooth',
      to: `/settings/projects/${project._id}` // Link to specific project settings
    }
    // Add Manage Members link later
    // { label: 'Quản lý Thành viên', icon: 'i-heroicons-users', to: `/settings/projects/${project._id}/members` }
  ]]

  // Only Owner can delete
  if (isOwner) {
    items.push([{
      label: 'Xóa Project',
      icon: 'i-heroicons-trash-20-solid',
      labelClass: 'text-error-500 dark:text-error-400', // (Rule 7)
      click: () => openDeleteModal(project) // Pass the project object
    }])
  }

  return items
}

// Open Delete Modal
function openDeleteModal(project: any) {
  projectToDelete.value = project
  isDeleteModalOpen.value = true
}

// Confirm Delete Project
async function confirmDelete() {
  if (!projectToDelete.value) return
  deleteLoading.value = true
  try {
    // (Rule 3)
    await $fetch(`/api/projects/${projectToDelete.value._id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xóa', description: `Đã xóa Project "${projectToDelete.value.name}".`, color: 'success' })
    isDeleteModalOpen.value = false
    const deletedProjectId = projectToDelete.value._id // Store ID before nulling
    projectToDelete.value = null
    await fetchUserProjects() // Reload project list

    // (NEW) If the deleted project was the selected one, select another
    if (selectedProject.value?._id === deletedProjectId) {
      selectProject(userProjects.value[0] || null) // Select the first available or null
    }
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể xóa Project.', color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}

// === Create Project Logic ===
const isCreateModalOpen = ref(false)

async function onProjectCreated(newProject: any) {
  await fetchUserProjects() // Reload list
  // Automatically select and navigate to the new project's overview page
  if (newProject?._id) {
    const found = userProjects.value.find(p => p._id === newProject._id)
    if (found) {
      selectProject(found) // Set as selected
      navigateTo(`/`) // Navigate to the new root project page
    }
  }
}

// Refresh Function
async function refreshProjects() {
  await fetchUserProjects()
}

// === Navigation ===
// (NEW) Navigate to the root project page
function navigateToProject(projectId: string) {
  // Find the project object to pass to selectProject if needed
  const project = userProjects.value.find(p => p._id === projectId)
  if (project) {
    selectProject(project) // Ensure the selected project state is updated
  }
  navigateTo(`/${projectId}`) // Use the new root route structure
}

useHead({
  title: 'Quản lý Projects'
})
</script>
