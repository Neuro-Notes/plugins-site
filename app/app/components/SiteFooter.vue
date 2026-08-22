<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong>Neuro Notes Plugins</strong>
        <p>{{ $t('footer.description') }}</p>
      </div>
      <div class="footer-links">
        <NuxtLink :to="localePath('/plugins')">{{ $t('nav.catalog') }}</NuxtLink>
        <a :href="docsUrl">{{ $t('nav.docs') }}</a>
        <a href="https://github.com/Neuro-Notes/plugins-site" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const docsUrl = useDocsUrl()
</script>
