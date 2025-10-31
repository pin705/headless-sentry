<template>
  <UDashboardPanel id="projects-list">
    <template #header>
      <UDashboardNavbar title="Quản lý Projects">
        <template #right>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-refresh-cw"
              :loading="loadingProjects"
              variant="ghost"
              color="neutral"
              aria-label="Làm mới"
              @click="refreshProjects"
            />
            <UButton
              icon="i-lucide-plus"
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
        class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-48 rounded-xl"
        />
      </div>

      <div
        v-else-if="userProjects.length === 0"
        class="p-6 flex flex-col items-center justify-center text-center min-h-[400px]"
      >
        <div
          class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
        >
          <UIcon
            name="i-lucide-folder"
            class="w-8 h-8 text-gray-400 dark:text-gray-600"
          />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Chưa có dự án nào
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Tạo dự án đầu tiên để bắt đầu giám sát các dịch vụ của bạn.
        </p>
        <UButton
          label="Tạo Project Mới"
          icon="i-lucide-plus"
          color="primary"
          size="lg"
          @click="isCreateModalOpen = true"
        />
      </div>

      <div
        v-else
        class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard
          v-for="project in userProjects"
          :key="project._id"
          class="flex flex-col transition-all duration-200"
          :ui="{
            body: { padding: 'p-5', class: 'flex-1 flex flex-col justify-between' },
            ring: 'ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700'
          }"
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
                  icon="i-lucide-more-vertical"
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
                  <div class="flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-users"
                      class="w-4 h-4"
                    />
                    <span>{{ project.memberCount }}</span>
                  </div>
                </UTooltip>
                <UTooltip text="Số lượng Monitors">
                  <div class="flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-activity"
                      class="w-4 h-4"
                    />
                    <span>{{ project.monitorCount }}</span>
                  </div>
                </UTooltip>
              </div>

              <UTooltip text="Ngày tạo">
                <div class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar"
                    class="w-4 h-4"
                  />
                  <span>{{ useDateFormat(project.createdAt, 'DD/MM/YYYY').value }}</span>
                </div>
              </UTooltip>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <UButton
              label="Xem tổng quan"
              icon="i-lucide-arrow-right"
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
console.log('currentUser', currentUser.value)
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
      // Sửa link trỏ đến trang chúng ta đã xây dựng
      to: `/${project._id}/general`
    },
    {
      label: 'Quản lý Thành viên',
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
