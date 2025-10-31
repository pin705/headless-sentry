<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cấu hình Thành viên" />
    </template>
    <template #body>
      <UCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold">
            Mời thành viên mới
          </h3>
        </template>

        <UForm
          :schema="inviteSchema"
          :state="form"
          class="flex items-end gap-4"
          @submit="handleInvite"
        >
          <UFormField
            label="Email"
            name="email"
            class="flex-1"
          >
            <UInput
              v-model="form.email"
              placeholder="email@example.com"
            />
          </UFormField>

          <UFormField
            label="Vai trò"
            name="role"
          >
            <USelectMenu
              v-model="form.role"
              :items="roleOptions"
            />
          </UFormField>

          <UButton
            type="submit"
            :loading="isInviting"
            icon="i-heroicons-paper-airplane"
          >
            Gửi lời mời
          </UButton>
        </UForm>
      </UCard>

      <UCard>
        <UTabs
          :items="tabItems"
          class="w-full"
        >
          <template #members>
            <UTable
              :columns="memberColumns"
              :data="data?.members"
              :loading="pending"
              :empty-state="{ icon: 'i-heroicons-users', label: 'Chưa có thành viên.' }"
              class="mt-4"
            />
          </template>

          <template #invites>
            <UTable
              :columns="inviteColumns"
              :data="data?.pendingInvites"
              :loading="pending"
              :empty-state="{ icon: 'i-heroicons-envelope', label: 'Không có lời mời nào đang chờ.' }"
              class="mt-4"
            />
          </template>
        </UTabs>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { z } from 'zod'

const route = useRoute()
const toast = useToast()
const projectId = computed(() => route.params.projectId)

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

// --- Cấu hình Tabs ---
const tabItems = computed(() => [
  {
    slot: 'members',
    label: 'Thành viên',
    icon: 'i-heroicons-users',
    // Hiển thị số lượng thành viên
    badge: data.value?.members?.length || 0
  },
  {
    slot: 'invites',
    label: 'Lời mời đang chờ',
    icon: 'i-heroicons-envelope',
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
        icon: 'i-heroicons-trash',
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
        icon: 'i-heroicons-clipboard-document',
        size: 'sm',
        color: 'gray',
        variant: 'ghost',
        title: 'Copy link mời',
        onClick: () => copyInviteLink(row.original.token)
      })
      const cancelButton = h(UButton, {
        icon: 'i-heroicons-x-circle',
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
    toast.add({ title: 'Đã copy link mời!', icon: 'i-heroicons-check-circle' })
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
    toast.add({ title: res.message, icon: 'i-heroicons-check-circle' })
    form.value.email = ''
    form.value.role = 'member'
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: error.data?.message, color: 'red', icon: 'i-heroicons-exclamation-circle' })
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
    toast.add({ title: 'Đã cập nhật vai trò', icon: 'i-heroicons-check-circle' })
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: error.data?.message, color: 'red', icon: 'i-heroicons-exclamation-circle' })
    await refreshLists() // Tải lại để reset dropdown nếu lỗi
  }
}

async function handleRemoveMember(memberId) {
  if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return
  try {
    await $fetch(`/api/projects/${projectId.value}/members/${memberId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Đã xóa thành viên', icon: 'i-heroicons-check-circle' })
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: error.data?.message, color: 'red', icon: 'i-heroicons-exclamation-circle' })
  }
}

async function handleCancelInvite(inviteId) {
  if (!confirm('Bạn có chắc muốn hủy lời mời này?')) return
  try {
    await $fetch(`/api/projects/${projectId.value}/invites/${inviteId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Đã hủy lời mời', icon: 'i-heroicons-check-circle' })
    await refreshLists()
  } catch (error) {
    toast.add({ title: 'Lỗi', description: error.data?.message, color: 'red', icon: 'i-heroicons-exclamation-circle' })
  }
}
</script>
