<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink :to="localePath('/')" class="brand-link" :aria-label="$t('common.home')">
        <span class="brand-mark"><img src="/icons/favicon-48x48.png" alt="" width="28" height="28"></span>
        <span>Neuro Notes <strong>Plugins</strong></span>
      </NuxtLink>
      <nav class="main-nav" :aria-label="$t('common.navigation')">
        <NuxtLink :to="localePath('/plugins')">{{ $t('nav.catalog') }}</NuxtLink>
        <a :href="docsUrl">{{ $t('nav.docs') }}</a>
        <NuxtLink v-if="auth.user.value" :to="localePath('/dashboard')">{{ $t('nav.dashboard') }}</NuxtLink>
        <NuxtLink v-if="auth.user.value?.isAdmin" :to="localePath('/admin/submissions')">{{ $t('nav.moderation') }}</NuxtLink>
      </nav>
      <div class="header-actions">
        <button class="icon-button" type="button" :aria-label="$t('theme.toggle')" @click="toggleTheme">
          <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" />
        </button>
        <NuxtLink :to="switchLocalePath(locale === 'ru' ? 'en' : 'ru')" class="locale-link">
          {{ locale === 'ru' ? 'EN' : 'RU' }}
        </NuxtLink>
        <NuxtLink v-if="!auth.user.value" :to="localePath('/login')" class="button button-secondary">
          {{ $t('nav.login') }}
        </NuxtLink>
        <button v-else class="button button-secondary" type="button" @click="logout">
          {{ $t('nav.logout') }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const { locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const auth = useMarketplaceAuth()
const docsUrl = useDocsUrl()

onMounted(() => auth.load())

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const logout = async () => {
  await auth.logout()
  await navigateTo(localePath('/'))
}
</script>
