<template>
  <div>
    <section class="hero container">
      <span class="eyebrow">{{ $t('home.eyebrow') }}</span>
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.description') }}</p>
      <div class="hero-actions">
        <NuxtLink :to="localePath('/plugins')" class="button button-primary">{{ $t('home.openCatalog') }}</NuxtLink>
        <a :href="docsUrl" class="button button-secondary">{{ $t('home.readDocs') }}</a>
      </div>
    </section>

    <section class="page-section container">
      <div class="feature-grid">
        <article class="feature-card">
          <Icon name="heroicons:shield-check" />
          <h2>{{ $t('home.features.review.title') }}</h2>
          <p>{{ $t('home.features.review.description') }}</p>
        </article>
        <article class="feature-card">
          <Icon name="heroicons:code-bracket" />
          <h2>{{ $t('home.features.contract.title') }}</h2>
          <p>{{ $t('home.features.contract.description') }}</p>
        </article>
        <article class="feature-card">
          <Icon name="heroicons:cloud" />
          <h2>{{ $t('home.features.github.title') }}</h2>
          <p>{{ $t('home.features.github.description') }}</p>
        </article>
      </div>
    </section>

    <section class="page-section container">
      <div class="page-heading">
        <h1>{{ $t('home.latest') }}</h1>
        <p>{{ $t('home.latestDescription') }}</p>
      </div>
      <div v-if="data?.items.length" class="plugin-grid">
        <PluginCard v-for="plugin in data.items" :key="plugin.id" :plugin="plugin" />
      </div>
      <EmptyState v-else :title="$t('catalog.emptyTitle')" :description="$t('catalog.emptyDescription')">
        <NuxtLink :to="localePath('/dashboard/submissions/new')" class="button button-primary">{{ $t('catalog.publishFirst') }}</NuxtLink>
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Paginated, PluginSummary } from '#shared/marketplace'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const docsUrl = useDocsUrl()
const { data } = await useFetch<Paginated<PluginSummary>>('/api/v1/plugins', {
  query: computed(() => ({ locale: locale.value, perPage: 3 }))
})

useSeoMeta({
  title: () => t('seo.homeTitle'),
  description: () => t('seo.homeDescription')
})
</script>
