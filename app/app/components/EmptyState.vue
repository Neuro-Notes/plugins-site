<template>
  <div class="empty-state">
    <Icon :name="icon" />
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string, description: string, icon?: string }>(), {
  icon: 'heroicons:puzzle-piece'
})
</script>
