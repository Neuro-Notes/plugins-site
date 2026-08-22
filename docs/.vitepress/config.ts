import { defineConfig } from 'vitepress'

const ruSidebar = [
  { text: 'Введение', items: [
    { text: 'Обзор API v1', link: '/ru/overview' },
    { text: 'Быстрый старт', link: '/ru/quickstart' }
  ] },
  { text: 'Справочник', items: [
    { text: 'Manifest', link: '/ru/manifest' },
    { text: 'Runtime и lifecycle', link: '/ru/runtime' },
    { text: 'Разрешения и безопасность', link: '/ru/permissions' },
    { text: 'Публикация через GitHub', link: '/ru/publishing' }
  ] }
]

const enSidebar = [
  { text: 'Introduction', items: [
    { text: 'API v1 overview', link: '/en/overview' },
    { text: 'Quick start', link: '/en/quickstart' }
  ] },
  { text: 'Reference', items: [
    { text: 'Manifest', link: '/en/manifest' },
    { text: 'Runtime and lifecycle', link: '/en/runtime' },
    { text: 'Permissions and security', link: '/en/permissions' },
    { text: 'Publishing from GitHub', link: '/en/publishing' }
  ] }
]

export default defineConfig({
  base: '/docs/',
  cleanUrls: true,
  lastUpdated: true,
  title: 'Neuro Notes Plugins',
  description: 'Developer documentation for Neuro Notes community plugins.',
  head: [
    ['link', { rel: 'icon', href: '/docs/icons/favicon-32x32.png', sizes: '32x32' }]
  ],
  locales: {
    ru: {
      label: 'Русский',
      lang: 'ru-RU',
      title: 'Neuro Notes Plugins',
      description: 'Документация для разработчиков community-плагинов.'
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Neuro Notes Plugins',
      description: 'Developer documentation for community plugins.'
    }
  },
  themeConfig: {
    logo: '/icons/favicon-48x48.png',
    search: {
      provider: 'local',
      options: {
        locales: {
          ru: {
            translations: {
              button: { buttonText: 'Поиск', buttonAriaLabel: 'Поиск по документации' },
              modal: {
                noResultsText: 'Ничего не найдено',
                resetButtonTitle: 'Сбросить поиск',
                footer: {
                  selectText: 'выбрать',
                  navigateText: 'перейти',
                  closeText: 'закрыть'
                }
              }
            }
          }
        }
      }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Neuro-Notes/plugins-site' }
    ],
    editLink: {
      pattern: 'https://github.com/Neuro-Notes/plugins-site/edit/master/docs/:path'
    },
    locales: {
      ru: {
        nav: [{ text: 'API v1', link: '/ru/overview' }],
        sidebar: ruSidebar,
        outline: { label: 'На странице' },
        docFooter: { prev: 'Предыдущая', next: 'Следующая' },
        editLink: { text: 'Предложить изменение' },
        lastUpdated: { text: 'Обновлено' },
        darkModeSwitchLabel: 'Тема',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Сменить язык'
      },
      en: {
        nav: [{ text: 'API v1', link: '/en/overview' }],
        sidebar: enSidebar,
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        editLink: { text: 'Suggest changes' },
        lastUpdated: { text: 'Updated' }
      }
    }
  }
})
