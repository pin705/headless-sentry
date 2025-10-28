import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    'nuxt-mongoose',
    'nuxt-auth-utils',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@pinia/nuxt'
  ],

  ssr: false,

    css: ['~/assets/css/tailwind.css'],

  devtools: {
    enabled: false
  },

  compatibilityDate: '2025-01-15',
  vite: {
    plugins: [tailwindcss()]
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  mongoose: {
    uri: process.env.MONGODB_URI, // Chúng ta sẽ tạo file .env ngay sau đây
    // options: {},
    modelsDir: 'models'
  }
})
