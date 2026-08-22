<template>
  <article class="plugin-card">
    <div class="plugin-card-heading">
      <div class="plugin-icon"><Icon name="heroicons:puzzle-piece" /></div>
      <div>
        <h2><NuxtLink :to="localePath(`/plugins/${plugin.id}`)">{{ plugin.name }}</NuxtLink></h2>
        <p class="muted">{{ plugin.id }} · v{{ plugin.version }}</p>
      </div>
    </div>
    <p>{{ plugin.summary || $t('catalog.noDescription') }}</p>
    <div class="tag-list">
      <span v-for="category in plugin.categories" :key="category" class="tag">{{ $t(`categories.${category}`) }}</span>
      <span v-if="plugin.warnings.length" class="tag tag-warning">
        {{ $t('compatibility.warningCount', { count: plugin.warnings.length }) }}
      </span>
    </div>
    <div class="plugin-card-footer">
      <span>{{ plugin.author }}</span>
      <NuxtLink :to="localePath(`/plugins/${plugin.id}`)" class="text-link">{{ $t('common.details') }}</NuxtLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PluginSummary } from '#shared/marketplace'

defineProps<{ plugin: PluginSummary }>()
const localePath = useLocalePath()
</script>
