<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { selectedProject } = useProjectState()

const links = computed(() => [
  [
    {
      label: 'Tổng quan',
      to: `/${selectedProject.value?._id || ''}`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    },
    {
      label: 'Giám sát',
      to: `/${selectedProject.value?._id}/monitoring`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    },
    {
      label: 'Cấu hình Giám sát',
      to: `/${selectedProject.value?._id}/monitoring/settings`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    },
    {
      label: 'Cấu hình Dự án',
      to: `/${selectedProject.value?._id}/project-settings`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    }
  ]
] satisfies NavigationMenuItem[][])
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <UDashboardToolbar class="border-none">
      <template #left>
        <ProjectSelector />
      </template>

      <template #right>
        <UserMenu />
      </template>
    </UDashboardToolbar>

    <UDashboardToolbar>
      <template #left>
        <UNavigationMenu
          :items="links"
          highlight
          class="flex-1"
        />
      </template>
    </UDashboardToolbar>

    <div class="mx-auto">
      <slot />
    </div>
  </div>
</template>
