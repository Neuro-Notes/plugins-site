import tailwindcss from '@tailwindcss/vite'

const isProduction = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-22',
  devtools: { enabled: !isProduction },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icons/favicon-48x48.png' }
      ]
    }
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    'nuxt-security'
  ],
  css: ['~/assets/styles/index.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  runtimeConfig: {
    backendBaseUrl: process.env.NUXT_BACKEND_BASE_URL || 'http://host.docker.internal:5001',
    githubToken: process.env.NUXT_GITHUB_TOKEN || '',
    sessionEncryptionKey: process.env.NUXT_SESSION_ENCRYPTION_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  i18n: {
    defaultLocale: 'ru',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    detectBrowserLanguage: false,
    locales: [
      { code: 'ru', name: 'Русский', language: 'ru-RU', file: 'ru.json' },
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' }
    ]
  },
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
    storageKey: 'neuro-notes-marketplace-theme'
  },
  icon: {
    provider: 'none',
    clientBundle: {
      scan: true
    }
  },
  security: {
    headers: {
      crossOriginResourcePolicy: 'same-origin',
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https://avatars.githubusercontent.com'],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"]
      }
    },
    rateLimiter: false
  },
  routeRules: {
    '/api/**': {
      headers: {
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex,nofollow,noarchive'
      }
    },
    '/login': { ssr: true, headers: { 'x-robots-tag': 'noindex,nofollow' } },
    '/en/login': { ssr: true, headers: { 'x-robots-tag': 'noindex,nofollow' } },
    '/dashboard/**': { ssr: true, headers: { 'x-robots-tag': 'noindex,nofollow' } },
    '/en/dashboard/**': { ssr: true, headers: { 'x-robots-tag': 'noindex,nofollow' } },
    '/admin/**': { ssr: true, headers: { 'x-robots-tag': 'noindex,nofollow' } },
    '/en/admin/**': { ssr: true, headers: { 'x-robots-tag': 'noindex,nofollow' } },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
  },
  nitro: {
    compressPublicAssets: true
  },
  typescript: {
    typeCheck: true
  }
})
