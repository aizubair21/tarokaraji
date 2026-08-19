// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ssr:false,
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    googleApiKey: process.env.GOOGLE_PRIVATE_KEY,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    GCAC:process.env.GOOGLE_CLIENT_EMAIL,
    GPK:process.env.GOOGLE_PK,
    GC: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
    
    public: {
      endpoint:process.env.GOOGLE_API_ENDPOINT,
    }
  },
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts'],
  css: ['@fortawesome/fontawesome-free/css/all.css'],
  googleFonts: {
    families: {
      'Hind+Siliguri': true,
    }
  },
  tailwindcss: {
    config: {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Hind Siliguri', 'sans-serif'],
          },
        },
      },
    },
  },
  app: {
    head: {
      title: 'তারকারাজী বিজনেস', // default fallback title
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/tarokaraji-business-logo.svg' },
      ],
    },
  },
  devtools: { enabled: true },

})
