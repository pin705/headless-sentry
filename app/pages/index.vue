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
          class="h-36" />
      </div>

      <div
        v-else-if="userProjects.length === 0"
        class="p-4 text-center text-gray-500 dark:text-gray-400"
      >
        </div>

      <div
        v-else
        class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard
          v-for="project in userProjects"
          :key="project._id"
          class="flex flex-col" :ui="{ body: { padding: 'p-4', class: 'flex-1 flex flex-col justify-between' }, ring: 'ring-1 ring-gray-200 dark:ring-gray-800' }"
        >
          <div>
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-2 min-w-0">
                <NuxtLink
                  :to="`/${project._id}`"
                  class="font-semibold text-lg truncate hover:text-primary-500"
                  @click.stop
                >
                  {{ project.name }}
                </NuxtLink>
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

            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-4">
                <UTooltip text="Số thành viên">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-heroicons-users" class="w-4 h-4" />
                    <span>{{ project.memberCount }}</span>
                  </div>
                </UTooltip>
                <UTooltip text="Số lượng Monitors">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
                    <span>{{ project.monitorCount }}</span>
                  </div>
                </UTooltip>
              </div>

              <UTooltip text="Ngày tạo">
                <div class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                  <span>{{ useDateFormat(project.createdAt, 'DD/MM/YYYY').value }}</span>
                </div>
              </UTooltip>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
             <UButton
                label="Xem tổng quan"
                icon="i-heroicons-arrow-right"
                trailing
                variant="link"
                :padded="false"
                :to="`/${project._id}`"
                @click.stop
             />
          </div>
        </UCard>
      </div>

      <CreateProjectModal
        v-model="isCreateModalOpen"
        @created="onProjectCreated"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useDateFormat } from '@vueuse/core' // Import để định dạng ngày

const toast = useToast()
const { user: currentUser } = useUserSession()
const { userProjects, loadingProjects, fetchUserProjects, selectProject, selectedProject } = useProjectState()

// Fetch projects on mount
onMounted(() => {
  fetchUserProjects()
})

// === CẬP NHẬT: Actions Logic (Dropdown) ===
const getActionItems = (project: any): DropdownMenuItem[][] => {
  const isOwner = project.ownerId === currentUser.value?.userId

  const items: DropdownMenuItem[][] = [[
    {
      label: 'Cài đặt chung',
      icon: 'i-heroicons-cog-6-tooth',
      // Sửa link trỏ đến trang chúng ta đã xây dựng
      to: `/${project._id}/general`
    },
    {
      label: 'Quản lý Thành viên',
      icon: 'i-heroicons-users',
      // Sửa link trỏ đến trang chúng ta đã xây dựng
      to: `/${project._id}/members`
    }
    // Bạn có thể thêm link đến các trang setting khác ở đây
  ]]

  // Only Owner can delete
  if (isOwner) {
    items.push([{
      label: 'Xóa Project',
      icon: 'i-heroicons-trash-20-solid',
      labelClass: 'text-error-500 dark:text-error-400',
      click: () => openDeleteModal(project)
    }])
  }

  return items
}

// Open Delete Modal (Giữ nguyên)
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const projectToDelete = ref<any>(null)

function openDeleteModal(project: any) {
  projectToDelete.value = project
  isDeleteModalOpen.value = true
}

// Confirm Delete Project (Giữ nguyên)
async function confirmDelete() {
  if (!projectToDelete.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/projects/${projectToDelete.value._id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xóa', description: `Đã xóa Project "${projectToDelete.value.name}".`, color: 'success' })
    isDeleteModalOpen.value = false
    const deletedProjectId = projectToDelete.value._id
    projectToDelete.value = null
    await fetchUserProjects()

    if (selectedProject.value?._id === deletedProjectId) {
      selectProject(userProjects.value[0] || null)
    }
  } catch (err: any) {
    toast.add({ title: 'Lỗi', description: err.data?.message || 'Không thể xóa Project.', color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}

// === Create Project Logic (Giữ nguyên) ===
const isCreateModalOpen = ref(false)

async function onProjectCreated(newProject: any) {
  await fetchUserProjects()
  if (newProject?._id) {
    const found = userProjects.value.find(p => p._id === newProject._id)
    if (found) {
      selectProject(found)
    }
  }
}

async function refreshProjects() {
  await fetchUserProjects()
}

useHead({
  title: 'Quản lý Projects'
})
</script>
