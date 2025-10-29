<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const { selectedProject } = useProjectState()
console.log('Selected Project in Layout:', selectedProject.value)
const links = [
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
    label: 'Cài đặt',
    to: `/${selectedProject.value?._id}/settings/status-page`,
    onSelect: () => {
      open.value = false
    }
  }
  ],
  [

  ]

] satisfies NavigationMenuItem[][]

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }
})
</script>

<template>
  <div>
    <UDashboardToolbar>
      <template #left>
        <ProjectSelector />
        <UNavigationMenu
          :items="links"
          highlight
          class="flex-1"
        />
      </template>

      <template #right>
        <UserMenu />
      </template>
    </UDashboardToolbar>

    <slot />
  </div>
</template>
