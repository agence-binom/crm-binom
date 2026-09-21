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
    '/': { prerender: false },
    // En-têtes de base à faible risque de régression visuelle (pas de CSP ici : une CSP mal
    // calibrée casse silencieusement Nuxt UI - à traiter séparément avec une vérification
    // manuelle du rendu). X-Frame-Options plutôt que frame-ancestors seul : plus large support
    // navigateur, l'app n'a aucun besoin d'être affichée dans une iframe tierce.
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }
    }
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
