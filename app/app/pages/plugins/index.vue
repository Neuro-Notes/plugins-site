<template>
  <section class="page-section container">
    <div class="page-heading">
      <span class="eyebrow">{{ $t('catalog.eyebrow') }}</span>
      <h1>{{ $t('catalog.title') }}</h1>
      <p>{{ $t('catalog.description') }}</p>
    </div>
    <div class="catalog-toolbar">
      <div class="field">
        <label for="plugin-search">{{ $t('catalog.search') }}</label>
        <input id="plugin-search" v-model="search" class="input" type="search" :placeholder="$t('catalog.searchPlaceholder')">
      </div>
      <div class="field">
        <label for="category-filter">{{ $t('catalog.category') }}</label>
        <select id="category-filter" v-model="category" class="select">
          <option value="">{{ $t('catalog.allCategories') }}</option>
          <option v-for="item in marketplaceCategories" :key="item" :value="item">{{ $t(`categories.${item}`) }}</option>
        </select>
      </div>
      <div class="field">
        <label for="sort-filter">{{ $t('catalog.sort') }}</label>
        <select id="sort-filter" v-model="sort" class="select">
          <option value="newest">{{ $t('catalog.sortNewest') }}</option>
          <option value="oldest">{{ $t('catalog.sortOldest') }}</option>
          <option value="name">{{ $t('catalog.sortName') }}</option>
        </select>
      </div>
    </div>
    <div v-if="status === 'pending'" class="empty-state"><p>{{ $t('common.loading') }}</p></div>
    <div v-else-if="data?.items.length" class="plugin-grid">
      <PluginCard v-for="plugin in data.items" :key="plugin.id" :plugin="plugin" />
    </div>
    <EmptyState v-else :title="$t('catalog.emptyTitle')" :description="$t('catalog.emptyDescription')" />
  </section>
</template>

<script setup lang="ts">
import { marketplaceCategories, type Paginated, type PluginSummary } from '#shared/marketplace'

const { locale, t } = useI18n()
const route = useRoute()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const category = ref(typeof route.query.category === 'string' ? route.query.category : '')
const sort = ref('newest')
const debouncedSearch = ref(search.value)
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, value => {
  clearTimeout(timer)
  timer = setTimeout(() => { debouncedSearch.value = value }, 250)
})

const query = computed(() => ({
  locale: locale.value,
  q: debouncedSearch.value,
  category: category.value,
  sort: sort.value
}))
const { data, status } = await useFetch<Paginated<PluginSummary>>('/api/v1/plugins', { query })

useSeoMeta({ title: () => t('seo.catalogTitle'), description: () => t('catalog.description') })
</script>
