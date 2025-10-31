<template>
  <UDropdown
    :items="items"
    :popper="{ placement: 'bottom-start' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      :icon="currentLocale === 'vi' ? 'i-lucide-flag' : 'i-lucide-globe'"
      :label="currentLocaleName"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
    />
  </UDropdown>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const toast = useToast()

const currentLocale = computed(() => locale.value)
const currentLocaleName = computed(() => {
  const current = locales.value.find((l: any) => l.code === locale.value)
  return current?.name || 'Language'
})

const items = computed(() => [
  locales.value.map((l: any) => ({
    label: l.name,
    icon: l.code === 'vi' ? 'i-lucide-flag' : 'i-lucide-globe',
    click: () => changeLanguage(l.code)
  }))
])

async function changeLanguage(lang: string) {
  try {
    // Update local state
    await setLocale(lang)

    // Update user preference in backend
    await $fetch('/api/user/language', {
      method: 'PUT',
      body: { language: lang }
    })

    toast.add({
      title: lang === 'vi' ? 'Đã thay đổi ngôn ngữ' : 'Language changed',
      description: lang === 'vi' ? 'Ngôn ngữ đã được đổi sang Tiếng Việt' : 'Language has been changed to English',
      color: 'success',
      timeout: 3000
    })
  } catch (error: any) {
    console.error('Failed to change language:', error)
    // Language still changes locally even if API fails
  }
}
</script>
