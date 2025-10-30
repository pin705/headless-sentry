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
    label: 'Cấu hình',
    to: `/${selectedProject.value?._id}/settings`,
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
        <UserMenu />
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
