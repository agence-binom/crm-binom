export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    documentsBucket: process.env.DOCUMENTS_BUCKET,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    storage: {
      // En dev : driver mémoire (défaut).
      // En production multi-instance, passer sur Redis :
      //   1. Installer ioredis : npm install ioredis
      //   2. Définir REDIS_URL dans l'environnement
      //   3. Remplacer la config ci-dessous par :
      //      'rate-limit': { driver: 'redis', url: process.env.REDIS_URL }
      'rate-limit': { driver: 'memory' }
    }
  },

  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
          warn(warning)
        }
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm']
    }
  }
})
