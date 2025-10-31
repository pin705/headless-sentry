import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    'nuxt-mongoose',
    'nuxt-auth-utils',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@nuxt/ui',
    'nuxt-cron',
    '@nuxtjs/i18n'
  ],

  ssr: false,

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    // Private keys (only available on server-side)
    email: {
      host: process.env.EMAIL_HOST || 'localhost',
      port: process.env.EMAIL_PORT || '587',
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
      from: process.env.EMAIL_FROM || 'noreply@headless-sentry.com'
    },

    // Public keys (exposed to client-side)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    },

    session: {
      cookie: {
        secure: false, // Chỉ dùng secure cookie trong production (HTTPS)
        sameSite: 'lax' // Hoặc 'none' nếu cần truy cập cross-site
      }
    }
  },

  routeRules: {
    '/status/**': { ssr: true }
  },

  compatibilityDate: '2025-01-15',
  vite: {
    plugins: [tailwindcss()]
  },

  cron: {
    runOnInit: false,
    timeZone: 'Asia/Ho_Chi_Minh',
    jobsDir: 'cron'
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
  },

  i18n: {
    locales: [
      {
        code: 'vi',
        name: 'Tiếng Việt',
        files: ['vi.json']
      },
      {
        code: 'en',
        name: 'English',
        files: ['en.json']
      }
    ],
    langDir: 'locales',
    defaultLocale: 'vi',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
