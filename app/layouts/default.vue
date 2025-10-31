<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
const { selectedProject } = useProjectState()
console.log('Selected Project in Layout:', selectedProject.value)

const links = computed(() => [
  [
    // {
    //   label: 'Dự án',
    //   to: `/`,
    //   onSelect: () => {
    //     open.value = false
    //   }
    // },
    {
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
      label: 'Cấu hình Giám sát',
      to: `/${selectedProject.value?._id}/monitoring/settings`,
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Cấu hình Dự án',
      to: `/${selectedProject.value?._id}/settings`,
      onSelect: () => {
        open.value = false
      }
    }
  ]

] satisfies NavigationMenuItem[][])
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
