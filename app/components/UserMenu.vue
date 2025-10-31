<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user, clear } = useUserSession()
const colorMode = useColorMode()
const appConfig = useAppConfig()

const colors = ['neutral', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const items = computed<DropdownMenuItem[][]>(() => ([
  [{
    slot: 'account' as const,
    disabled: true
  }],
  // --- PHẦN MỚI THÊM ---
  [{
    label: 'Cài đặt tài khoản',
    icon: 'i-heroicons-cog-8-tooth',
    to: '/profile' // Link đến trang profile
  }, {
    label: 'Bảng giá',
    icon: 'i-lucide-credit-card',
    to: '/pricing'
  }],
  [
    {
      label: 'Theme',
      icon: 'i-lucide-palette',
      children: [{
        label: 'Primary',
        slot: 'chip',
        chip: appConfig.ui.colors.primary,
        content: {
          align: 'center',
          collisionPadding: 16
        },
        children: colors.map(color => ({
          label: color,
          chip: color,
          slot: 'chip',
          checked: appConfig.ui.colors.primary === color,
          type: 'checkbox',
          onSelect: (e) => {
            e.preventDefault()

            appConfig.ui.colors.primary = color
          }
        }))
      }, {
        label: 'Neutral',
        slot: 'chip',
        chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
        content: {
          align: 'end',
          collisionPadding: 16
        },
        children: neutrals.map(color => ({
          label: color,
          chip: color === 'neutral' ? 'old-neutral' : color,
          slot: 'chip',
          type: 'checkbox',
          checked: appConfig.ui.colors.neutral === color,
          onSelect: (e) => {
            e.preventDefault()

            appConfig.ui.colors.neutral = color
          }
        }))
      }]
    },
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'System',
          icon: 'i-lucide-monitor',
          type: 'checkbox',
          checked: colorMode.value === 'system',
          onSelect(e: Event) {
            e.preventDefault()

            colorMode.preference = 'system'
          }
        },
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()

            colorMode.preference = 'light'
          }
        }, {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        }]
    }

  ], [ // Add a new section for Logout
    {
      label: 'Đăng xuất', // Logout label
      icon: 'i-lucide-log-out',
      // Define the click action
      onSelect: async () => {
        console.log('Logging out...')
        await clear()
        // Optionally redirect, though middleware might handle this
        await navigateTo('/login')
      }
    }
  ]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
      :avatar="{
        src: user?.avatarUrl || 'https://i.pravatar.cc/150',
        alt: 'User Avatar',
        size: collapsed ? 'md' : 'sm'
      }"
    />

    <template #account>
      <div class="text-left">
        <p>
          Đăng nhập với
        </p>
        <p class="truncate font-medium text-gray-900 dark:text-white">
          {{ user?.name || user?.email }}
        </p>
      </div>
    </template>

    <!-- <template #locale>
      <div class="p-2">
        <ULocaleSelect
          v-model="locale"
          :locales="Object.values(locales)"
        />
      </div>
    </template> -->
  </UDropdownMenu>
</template>
