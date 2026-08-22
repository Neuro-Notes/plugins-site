<template>
  <section class="page-section container">
    <div v-if="plugin" class="detail-grid">
      <div>
        <div class="page-heading">
          <span class="eyebrow">{{ plugin.id }} · v{{ plugin.version }}</span>
          <h1>{{ plugin.name }}</h1>
          <p>{{ plugin.summary || $t('catalog.noDescription') }}</p>
        </div>
        <AppAlert v-if="plugin.warnings.length" kind="warning">
          <strong>{{ $t('compatibility.title') }}</strong>
          <ul>
            <li v-for="warning in plugin.warnings" :key="warning.code">{{ $t(`compatibility.warnings.${warning.code}`) }}</li>
          </ul>
        </AppAlert>
        <article class="panel prose">
          <h2>{{ $t('plugin.description') }}</h2>
          <p class="plugin-description">{{ plugin.description || plugin.manifest.description || $t('catalog.noDescription') }}</p>
        </article>
        <article class="panel">
          <h2>{{ $t('plugin.manifest') }}</h2>
          <pre class="manifest-code">{{ JSON.stringify(plugin.manifest, null, 2) }}</pre>
        </article>
        <article class="panel">
          <h2>{{ $t('plugin.versions') }}</h2>
          <div class="submission-list">
            <div v-for="version in versions?.items" :key="version.version" class="submission-row">
              <div class="submission-heading"><strong>v{{ version.version }}</strong><span class="muted">{{ formatDate(version.publishedAt) }}</span></div>
              <a :href="version.releaseUrl" target="_blank" rel="noreferrer" class="text-link">{{ $t('plugin.openRelease') }}</a>
            </div>
          </div>
        </article>
      </div>
      <aside class="detail-sidebar">
        <div class="panel">
          <a :href="plugin.source.releaseUrl" target="_blank" rel="noreferrer" class="button button-primary">{{ $t('plugin.openRelease') }}</a>
          <a :href="plugin.source.repositoryUrl" target="_blank" rel="noreferrer" class="button button-secondary">{{ $t('plugin.repository') }}</a>
        </div>
        <div class="panel">
          <dl class="meta-list">
            <div><dt>{{ $t('plugin.author') }}</dt><dd>{{ plugin.author }}</dd></div>
            <div><dt>{{ $t('plugin.runtime') }}</dt><dd>{{ plugin.manifest.runtime }}</dd></div>
            <div><dt>{{ $t('plugin.apiVersion') }}</dt><dd>{{ plugin.manifest.apiVersion }}</dd></div>
            <div><dt>{{ $t('plugin.published') }}</dt><dd>{{ formatDate(plugin.publishedAt) }}</dd></div>
          </dl>
        </div>
        <div v-if="plugin.categories.length" class="panel">
          <h3>{{ $t('plugin.categories') }}</h3>
          <div class="tag-list"><span v-for="item in plugin.categories" :key="item" class="tag">{{ $t(`categories.${item}`) }}</span></div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PluginDetail } from '#shared/marketplace'

const route = useRoute()
const { locale, t } = useI18n()
const id = String(route.params.id)
const { data: plugin } = await useFetch<PluginDetail>(`/api/v1/plugins/${encodeURIComponent(id)}`, {
  query: computed(() => ({ locale: locale.value }))
})
const { data: versions } = await useFetch<{ items: Array<{ version: string, releaseUrl: string, publishedAt: string }> }>(
  `/api/v1/plugins/${encodeURIComponent(id)}/versions`,
  { query: computed(() => ({ locale: locale.value })) }
)
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(value))

useSeoMeta({
  title: () => plugin.value ? `${plugin.value.name} — Neuro Notes Plugins` : t('seo.catalogTitle'),
  description: () => plugin.value?.summary || t('catalog.description')
})
</script>
