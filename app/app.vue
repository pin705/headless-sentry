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

const title = 'Headless Sentry - Giám sát Uptime, API & SSL cho Website'
const description = 'Giám sát uptime, hiệu năng API và chứng chỉ SSL 24/7. Cảnh báo realtime qua Slack, Telegram. Status page công khai cho khách hàng. Báo cáo SLA chi tiết. Bắt đầu miễn phí ngay hôm nay!'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: 'https://headless-sentry.com',
  ogImage: '/og-image.png',
  ogImageAlt: 'Headless Sentry - Giám sát Uptime & Hiệu năng',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: '/og-image.png',
  twitterSite: '@headlesssentry',
  keywords: 'uptime monitoring, website monitoring, API monitoring, SSL monitoring, status page, giám sát uptime, giám sát website, cảnh báo sự cố',
  author: 'Headless Sentry',
  robots: 'index, follow'
})

// Add structured data (JSON-LD) for better SEO
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Headless Sentry',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
          priceValidUntil: '2025-12-31',
          availability: 'https://schema.org/InStock'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '150'
        },
        featureList: [
          'Giám sát uptime 24/7',
          'Kiểm tra SSL tự động',
          'Cảnh báo realtime',
          'Status page công khai',
          'Báo cáo SLA chi tiết'
        ]
      })
    }
  ]
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
