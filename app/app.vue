<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Headless Sentry - Giám sát Uptime & API'
const description = 'Một công cụ chuyên nghiệp để theo dõi thời gian thực Uptime, Độ trễ (Latency), và trạng thái SSL của các dịch vụ API, website Headless của bạn.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  // (Tùy chọn) Bạn có thể tạo một ảnh 'og-image.png' mới cho dự án
  ogImage: '/og-image.png',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
