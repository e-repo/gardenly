export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    'vuetify-nuxt-module',
  ],
  ssr: false,
  devtools: {
    enabled: false,
  },
  css: ['@mdi/font/css/materialdesignicons.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru',
      },
    },
  },
  typescript: {
    strict: true,
  },
  eslint: {
    config: {
      stylistic: false,
    },
  },
  i18n: {
    locales: [{ code: 'ru', language: 'ru-RU', file: 'ru.json' }],
    defaultLocale: 'ru',
    strategy: 'no_prefix',
    restructureDir: 'app/i18n',
    langDir: 'locales',
  },
  vuetify: {
    moduleOptions: {
      importComposables: false,
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'gardenlyLight',
        themes: {
          gardenlyLight: {
            dark: false,
            colors: {
              primary: '#009688',
              secondary: '#607D8B',
              info: '#607D8B',
              background: '#ECEFF1',
              surface: '#FFFFFF',
              'surface-variant': '#E0F2F1',
              'teal-lighten-5': '#E0F2F1',
              'blue-grey-darken-4': '#263238',
              'on-primary': '#FFFFFF',
              'on-secondary': '#FFFFFF',
              'on-background': '#263238',
              'on-surface': '#263238',
            },
          },
        },
      },
    },
  },
});
