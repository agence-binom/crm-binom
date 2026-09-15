export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    // Préfixe NUXT_ : Nitro peut surcharger cette clé au démarrage du conteneur, sans rebuild.
    documentsBucket: process.env.NUXT_DOCUMENTS_BUCKET,
    s3Endpoint: process.env.NUXT_S3_ENDPOINT,
    s3Region: process.env.NUXT_S3_REGION,
    s3AccessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'production'
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    storage: {
      // Driver mémoire : suffisant tant qu'une seule instance sert le trafic. En multi-instance
      // chaque instance compterait son propre quota - passer sur Redis (procédure dans le README).
      'rate-limit': { driver: 'memory' }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
