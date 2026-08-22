<template>
  <DefaultTheme.Layout>
    <template #nav-bar-content-after>
      <a class="catalog-link" :href="catalogUrl">{{ catalogLabel }}</a>
    </template>
    <template #nav-screen-content-after>
      <a class="catalog-link catalog-link-mobile" :href="catalogUrl">{{ catalogLabel }}</a>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const themeStorageKey = 'neuro-notes-marketplace-theme'
const { isDark, lang } = useData()
const isEnglish = computed(() => lang.value.startsWith('en'))
const catalogUrl = computed(() => isEnglish.value ? '/en/plugins' : '/plugins')
const catalogLabel = computed(() => isEnglish.value ? 'Catalog' : 'Каталог')

onMounted(() => {
  const storedTheme = localStorage.getItem(themeStorageKey)
  if (storedTheme === 'dark' || storedTheme === 'light') {
    isDark.value = storedTheme === 'dark'
  }

  watch(isDark, value => localStorage.setItem(themeStorageKey, value ? 'dark' : 'light'), { immediate: true })

  window.addEventListener('storage', event => {
    if (event.key === themeStorageKey && (event.newValue === 'dark' || event.newValue === 'light')) {
      isDark.value = event.newValue === 'dark'
    }
  })
})
</script>
