<template>
  <div>
    <h2 class="text-xl font-semibold border-b pb-2">Quản lý thành viên</h2>

    <form @submit.prevent="handleInvite" class="mt-4 flex gap-2">
      <input
        v-model="emailToInvite"
        type="email"
        placeholder="Nhập email để mời..."
        class="border flex-grow p-2 rounded-md"
        required
      />
      <button
        type="submit"
        :disabled="isInviting"
        class="bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {{ isInviting ? 'Đang gửi...' : 'Mời' }}
      </button>
    </form>

    <div class="mt-6">
      <h3 class="font-medium">Thành viên trong dự án</h3>
      <div v-if="pendingMembers">Đang tải danh sách...</div>
      <ul v-else-if="members" class="mt-2 space-y-2">
        <li
          v-for="member in members"
          :key="member.id"
          class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
        >
          <div>
            <span class="font-semibold">{{ member.user.name }}</span>
            <span class="text-gray-500 ml-2">({{ member.user.email }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ member.role }}</span>
            <button
              @click="handleRemove(member.id)"
              class="text-red-500 hover:text-red-700"
              title="Xóa thành viên"
            >
              (Xóa)
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const projectId = computed(() => route.params.id)

const emailToInvite = ref('')
const isInviting = ref(false)

// 1. Fetch danh sách thành viên
const { data: members, pending: pendingMembers, refresh: refreshMembers } = await useFetch(
  `/api/projects/${projectId.value}/members`
)

// 2. Logic mời thành viên
async function handleInvite() {
  if (!emailToInvite.value) return
  isInviting.value = true

  try {
    await $fetch(`/api/projects/${projectId.value}/members/invite`, {
      method: 'POST',
      body: { email: emailToInvite.value, role: 'member' }, // Gửi email và vai trò
    })
    alert(`Đã gửi lời mời đến ${emailToInvite.value}`)
    emailToInvite.value = ''
    await refreshMembers() // Tải lại danh sách
  } catch (error) {
    console.error('Lỗi mời:', error)
    alert('Lỗi: ' + error.data?.message || 'Không thể gửi lời mời')
  } finally {
    isInviting.value = false
  }
}

// 3. Logic xóa thành viên
async function handleRemove(memberId) {
  if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi dự án?')) return

  try {
    await $fetch(`/api/projects/${projectId.value}/members/${memberId}`, {
      method: 'DELETE',
    })
    alert('Đã xóa thành viên')
    await refreshMembers() // Tải lại danh sách
  } catch (error) {
    console.error('Lỗi xóa:', error)
    alert('Không thể xóa thành viên')
  }
}
</script>
