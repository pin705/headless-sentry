<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Tổng quan', // <-- Đổi từ 'Home'
  // icon: 'i-lucide-layout-dashboard', // <-- Đổi icon cho hợp lý
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Giám sát', // <-- Đổi từ 'API Giám sát'
  // icon: 'i-lucide-server',
  to: '/api-monitoring',
  // badge: '4', // (Tạm ẩn badge cứng)
  onSelect: () => {
    open.value = false
  }
},
{ // (MỚI) Thêm mục Settings
  label: 'Cài đặt',
  // icon: 'i-lucide-settings', // Icon
  to: '/settings/status-page', // Đường dẫn
  onSelect: () => {
    open.value = false
  }
}
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <div>
    <div class="mb-4">
      <UDashboardToolbar>
      <UNavigationMenu
        :items="links"
        highlight
        class="flex-1"
      />
    </UDashboardToolbar>
    </div>

      <slot />
  </div>
</template>
