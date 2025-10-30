<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cấu hình Thành viên" />
    </template>
    <template #body>
      <UCard>
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
        <template #header>
          <h3 class="text-lg font-semibold">
            Thành viên trong dự án
          </h3>
        </template>
        <UTable
          :columns="memberColumns"
          :data="data?.members"
          :loading="pending"
          :empty-state="{ icon: 'i-heroicons-users', label: 'Chưa có thành viên.' }"
        >
          <template #user-data="{ row }">
            <div class="flex flex-col">
              <span class="font-medium">{{ row.userId?.name || 'N/A' }}</span>
              <span class="text-xs text-gray-500">{{ row.userId?.email || row.email }}</span>
            </div>
          </template>

          <template #role-data="{ row }">
            <USelectMenu
              :model-value="row.role"
              :items="roleOptions"
              :disabled="row.role === 'owner'"
              @update:model-value="(newRole) => handleChangeRole(row._id, newRole)"
            />
          </template>

          <template #actions-data="{ row }">
            <UButton
              v-if="row.role !== 'owner'"
              icon="i-heroicons-trash"
              size="sm"
              color="red"
              variant="ghost"
              title="Xóa thành viên"
              @click="handleRemoveMember(row._id)"
            />
          </template>
        </UTable>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Lời mời đang chờ
          </h3>
        </template>
        <UTable
          :columns="inviteColumns"
          :data="data?.pendingInvites"
          :loading="pending"
          :empty-state="{ icon: 'i-heroicons-envelope', label: 'Không có lời mời nào đang chờ.' }"
        >
          <template #actions-data="{ row }">
            <UButton
              icon="i-heroicons-x-circle"
              size="sm"
              color="gray"
              variant="ghost"
              title="Hủy lời mời"
              @click="handleCancelInvite(row._id)"
            />
          </template>
        </UTable>
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

// --- Cấu hình cột cho Bảng ---
const memberColumns = [
  { accessorKey: 'user', header: 'Thành viên' },
  { accessorKey: 'role', header: 'Vai trò', class: 'w-40' },
  { accessorKey: 'actions', header: 'Hành động', class: 'w-20 text-right' }
]
const inviteColumns = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Vai trò', class: 'w-40' },
  { accessorKey: 'actions', header: 'Hành động', class: 'w-20 text-right' }
]

// --- Fetch Data ---
// (Sử dụng API /api/projects/[projectId]/members/index.get.ts đã tạo ở bước trước)
const { data, pending, refresh: refreshLists } = await useFetch(
  () => `/api/projects/${projectId.value}/members`
)

// --- Logic (đã cập nhật để dùng useToast) ---

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
