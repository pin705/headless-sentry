<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { selectedProject } = useProjectState()

const links = computed(() => [
  [
    {
      label: 'Tổng quan',
      to: `/${selectedProject.value?._id || ''}`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400',
      icon: 'i-lucide-layout-dashboard'
    },
    {
      label: 'Giám sát',
      to: `/${selectedProject.value?._id}/monitoring`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400',
      icon: 'i-lucide-activity'
    },
    {
      label: 'Bảo trì',
      to: `/${selectedProject.value?._id}/maintenance`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400',
      icon: 'i-lucide-wrench'
    },
    {
      label: 'Báo cáo SLA',
      to: `/${selectedProject.value?._id}/reports`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400',
      icon: 'i-lucide-chart-bar'
    },
    {
      label: 'Cài đặt',
      to: `/${selectedProject.value?._id}/monitoring/settings`,
      exactActiveClass: 'text-primary-600 dark:text-primary-400',
      icon: 'i-lucide-settings'
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
