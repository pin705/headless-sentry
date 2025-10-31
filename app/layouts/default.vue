<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { selectedProject } = useProjectState()

const links = computed(() => [
  [
    {
      label: 'Tổng quan',
      icon: 'i-lucide-layout-dashboard',
      to: `/${selectedProject.value?._id || ''}`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    },
    {
      label: 'Giám sát',
      icon: 'i-lucide-activity',
      to: `/${selectedProject.value?._id}/monitoring`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    },
    {
      label: 'Cấu hình Giám sát',
      icon: 'i-lucide-settings',
      to: `/${selectedProject.value?._id}/monitoring/settings`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    },
    {
      label: 'Cấu hình Dự án',
      icon: 'i-lucide-folder-cog',
      to: `/${selectedProject.value?._id}/settings`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400'
    }
  ]
] satisfies NavigationMenuItem[][])
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <UDashboardToolbar class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <template #left>
        <ProjectSelector />
      </template>

      <template #right>
        <UserMenu />
      </template>
    </UDashboardToolbar>

    <UDashboardToolbar class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
