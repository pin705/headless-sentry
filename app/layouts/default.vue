<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
const { selectedProject } = useProjectState()
console.log('Selected Project in Layout:', selectedProject.value)

const links = computed(() => [
  [{
    label: 'Tổng quan',
    to: `/${selectedProject.value?._id || ''}`,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Giám sát',
    to: `/${selectedProject.value?._id}/monitoring`,
    // badge: '4', // (Tạm ẩn badge cứng)
    onSelect: () => {
      open.value = false
    }
  },
  {
    // Đổi tên cho rõ nghĩa
    label: 'Cấu hình Giám sát',
    to: `/${selectedProject.value?._id}/monitoring/settings`,
    onSelect: () => {
      open.value = false
    }
  },
  // --- MỤC MỚI THÊM ---
  {
    label: 'Cài đặt chung',
    to: `/${selectedProject.value?._id}/general`, // Trỏ đến general.vue
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Thành viên',
    to: `/${selectedProject.value?._id}/members`, // Trỏ đến members.vue
    onSelect: () => {
      open.value = false
    }
  }
  ]

] satisfies NavigationMenuItem[][])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }
})
</script>

<template>
  <div>
    <UDashboardToolbar class="border-none">
      <template #left>
        <ProjectSelector />
      </template>

      <template #right>
        <UserlayMenu />
      </template>
    </UDashboardToolbar>

    <UDashboardToolbar class="border-none">
      <template #left>
        <UNavigationMenu
          :items="links"
          highlight
          class="flex-1"
        />
      </template>
    </UDashboardToolbar>

    <slot />
  </div>
</template>
