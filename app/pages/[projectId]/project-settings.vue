<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cài đặt Dự án">
        <template #description>
          Quản lý thông tin dự án và thành viên
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTabs
        :items="configTabs"
        orientation="vertical"
      >
        <template #general>
          <UCard
            :ui="{
              body: { padding: 'p-6' },
              ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
            }"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-settings"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Thông tin chung
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Cập nhật thông tin cơ bản của dự án
                  </p>
                </div>
              </div>
            </template>

            <UForm
              :schema="schema"
              :state="state"
              class="space-y-6"
              @submit="handleUpdateProject"
            >
              <UFormField
                label="Tên dự án"
                name="name"
                class="max-w-lg"
              >
                <UInput
                  v-model="state.name"
                  icon="i-lucide-folder"
                />
              </UFormField>

              <div class="flex items-center gap-3 pt-4">
                <UButton
                  type="submit"
                  icon="i-lucide-save"
                  :loading="isUpdating"
                  color="primary"
                >
                  Lưu thay đổi
                </UButton>
              </div>
            </UForm>
          </UCard>
        </template>
        <template #members>
          <div class="space-y-6">
            <UCard
              :ui="{
                body: { padding: 'p-6' },
                ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
              }"
            >
              <template #header>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900 flex items-center justify-center">
                    <UIcon
                      name="i-lucide-user-plus"
                      class="w-5 h-5 text-success-600 dark:text-success-400"
                    />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Mời thành viên mới
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Thêm người dùng vào dự án của bạn
                    </p>
                  </div>
                </div>
              </template>

              <UForm
                :schema="inviteSchema"
                :state="form"
                class="flex flex-col sm:flex-row items-end gap-4"
                @submit="handleInvite"
              >
                <UFormField
                  label="Email"
                  name="email"
                  class="flex-1 w-full"
                >
                  <UInput
                    v-model="form.email"
                    placeholder="email@example.com"
                    icon="i-lucide-mail"
                  />
                </UFormField>

                <UFormField
                  label="Vai trò"
                  name="role"
                  class="w-full sm:w-40"
                >
                  <USelectMenu
                    v-model="form.role"
                    :items="roleOptions"
                  />
                </UFormField>

                <UButton
                  type="submit"
                  :loading="isInviting"
                  icon="i-lucide-send"
                  color="primary"
                >
                  Gửi lời mời
                </UButton>
              </UForm>
            </UCard>

            <UCard
              :ui="{
                body: { padding: 'p-0' },
                ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
              }"
            >
              <template #header>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-info-100 dark:bg-info-900 flex items-center justify-center">
                    <UIcon
                      name="i-lucide-users"
                      class="w-5 h-5 text-info-600 dark:text-info-400"
                    />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Quản lý thành viên
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Xem và quản lý người dùng trong dự án
                    </p>
                  </div>
                </div>
              </template>

              <UTabs
                :items="tabItems"
                class="w-full"
              >
                <template #members>
                  <UTable
                    :columns="memberColumns"
                    :data="data?.members"
                    :loading="pending"
                    :empty-state="{ icon: 'i-lucide-users', label: 'Chưa có thành viên.' }"
                  />
                </template>

                <template #invites>
                  <UTable
                    :columns="inviteColumns"
                    :data="data?.pendingInvites"
                    :loading="pending"
                    :empty-state="{ icon: 'i-lucide-mail', label: 'Không có lời mời nào đang chờ.' }"
                  />
                </template>
              </UTabs>
            </UCard>
          </div>
        </template>
      </UTabs>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { z } from 'zod'

const route = useRoute()
const toast = useToast()
const projectId = computed(() => route.params.projectId)

// --- Utility Functions ---
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    return ((error as { data?: { message?: string } }).data?.message) || 'Đã xảy ra lỗi'
  }
  return 'Đã xảy ra lỗi'
}

// --- Constants ---
const roleOptions = ['admin', 'member']

// --- Schema và State cho Form Mời ---
const inviteSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(roleOptions)
})
const form = ref({
  email: '',
  role: 'member'
})
const isInviting = ref(false)
const USelectMenu = resolveComponent('USelectMenu')
const UButton = resolveComponent('UButton')

const { data, pending, refresh: refreshLists } = await useFetch(
  () => `/api/projects/${projectId.value}/members`
)

// Sửa lại để sử dụng đúng tên từ composable
const { selectedProject, selectProject } = useProjectState()

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
await useFetch(
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

    toast.add({ title: 'Cập nhật thành công!', icon: 'i-lucide-check-circle' })

    // Cập nhật lại state toàn cục
    selectProject(updatedProject)
    // Bạn cũng có thể gọi refreshFetchedProject() nếu cần
  } catch (error) {
    console.error('Lỗi cập nhật:', error)
    toast.add({
      title: 'Lỗi',
      description: getErrorMessage(error),
      color: 'red',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isUpdating.value = false
  }
}

const configTabs = [
  { slot: 'general', label: 'Thông tin chung', icon: 'i-lucide-settings' },
  { slot: 'members', label: 'Thành viên & Lời mời', icon: 'i-lucide-users' }
]

// --- Cấu hình Tabs ---
const tabItems = computed(() => [
  {
    slot: 'members',
    label: 'Thành viên',
    icon: 'i-lucide-users',
    // Hiển thị số lượng thành viên
    badge: data.value?.members?.length || 0
  },
  {
    slot: 'invites',
    label: 'Lời mời đang chờ',
    icon: 'i-lucide-mail',
    // Hiển thị số lượng lời mời
    badge: data.value?.pendingInvites?.length || 0
  }
])

const memberColumns = [
  {
    accessorKey: 'user', // Giống ví dụ của bạn
    header: 'Thành viên',
    cell: ({ row }) => { // Giống ví dụ của bạn
      const userName = row.original.userId?.name || 'N/A'
      const userEmail = row.original.userId?.email || row.original.email
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, userName),
        h('span', { class: 'text-xs text-gray-500' }, userEmail)
      ])
    }
  },
  {
    accessorKey: 'role',
    header: 'Vai trò',
    class: 'w-48',
    cell: ({ row }) => {
      // Owner thì chỉ hiển thị text
      if (row.original.role === 'owner') {
        return h('span', { class: 'font-medium p-1 text-gray-700 dark:text-gray-300' }, 'Owner')
      }

      // Render component USelectMenu
      return h(USelectMenu, {
        'modelValue': row.original.role,
        'options': roleOptions,
        'disabled': row.original.role === 'owner',
        'onUpdate:modelValue': newRole => handleChangeRole(row.original._id, newRole)
      })
    }
  },
  {
    accessorKey: 'actions',
    header: 'Hành động',
    class: 'w-20 text-right',
    cell: ({ row }) => {
      if (row.original.role === 'owner') {
        return null // Không có hành động cho Owner
      }

      // Render component UButton
      return h(UButton, {
        icon: 'i-lucide-trash-2',
        size: 'sm',
        color: 'red',
        variant: 'ghost',
        title: 'Xóa thành viên',
        onClick: () => handleRemoveMember(row.original._id)
      })
    }
  }
]

// Đây là inviteColumns bạn nói đang sai, giờ đã được viết lại
const inviteColumns = [
  {
    accessorKey: 'email', // Dùng cell mặc định (chỉ text)
    header: 'Email'
  },
  {
    accessorKey: 'role', // Dùng cell mặc định (chỉ text)
    header: 'Vai trò',
    class: 'w-48'
  },
  {
    accessorKey: 'actions',
    header: 'Hành động',
    class: 'w-28 text-right',
    cell: ({ row }) => {
      // Render 2 nút bấm
      const copyButton = h(UButton, {
        icon: 'i-lucide-copy',
        size: 'sm',
        color: 'gray',
        variant: 'ghost',
        title: 'Copy link mời',
        onClick: () => copyInviteLink(row.original.token)
      })
      const cancelButton = h(UButton, {
        icon: 'i-lucide-x-circle',
        size: 'sm',
        color: 'gray',
        variant: 'ghost',
        title: 'Hủy lời mời',
        onClick: () => handleCancelInvite(row.original._id)
      })
      // Trả về một div bọc 2 nút
      return h('div', { class: 'flex items-center justify-end gap-2' }, [copyButton, cancelButton])
    }
  }
]

// --- HÀM MỚI: Copy Link Mời ---
function getInviteLink(token) {
  const origin = window.location.origin
  return `${origin}/accept-invite?token=${token}`
}

function copyInviteLink(token) {
  const link = getInviteLink(token)
  navigator.clipboard.writeText(link).then(() => {
    toast.add({ title: 'Đã copy link mời!', icon: 'i-lucide-check-circle' })
  }).catch(() => {
    toast.add({ title: 'Lỗi', description: 'Không thể tự động copy', color: 'red' })
  })
}

async function handleInvite() {
  isInviting.value = true
  try {
    const res = await $fetch(`/api/projects/${projectId.value}/members/invite`, {
      method: 'POST',
      body: { ...form.value }
    })
    toast.add({ title: res.message, icon: 'i-lucide-check-circle' })
    form.value.email = ''
    form.value.role = 'member'
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: getErrorMessage(error), color: 'red', icon: 'i-lucide-alert-circle' })
  } finally {
    isInviting.value = false
  }
}

async function handleChangeRole(memberId, newRole) {
  try {
    await $fetch(`/api/projects/${projectId.value}/members/${memberId}`, {
      method: 'PUT',
      body: { role: newRole }
    })
    toast.add({ title: 'Đã cập nhật vai trò', icon: 'i-lucide-check-circle' })
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: getErrorMessage(error), color: 'red', icon: 'i-lucide-alert-circle' })
    await refreshLists() // Tải lại để reset dropdown nếu lỗi
  }
}

async function handleRemoveMember(memberId) {
  if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return
  try {
    await $fetch(`/api/projects/${projectId.value}/members/${memberId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Đã xóa thành viên', icon: 'i-lucide-check-circle' })
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: getErrorMessage(error), color: 'red', icon: 'i-lucide-alert-circle' })
  }
}

async function handleCancelInvite(inviteId) {
  if (!confirm('Bạn có chắc muốn hủy lời mời này?')) return
  try {
    await $fetch(`/api/projects/${projectId.value}/invites/${inviteId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Đã hủy lời mời', icon: 'i-lucide-check-circle' })
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: getErrorMessage(error), color: 'red', icon: 'i-lucide-alert-circle' })
  }
}
</script>
