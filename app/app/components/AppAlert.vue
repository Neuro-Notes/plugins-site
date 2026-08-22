<template>
  <div class="alert" :class="`alert-${kind}`" role="status">
    <Icon :name="kind === 'error' ? 'heroicons:exclamation-circle' : kind === 'warning' ? 'heroicons:exclamation-triangle' : 'heroicons:information-circle'" />
    <div><slot /></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'info' | 'warning' | 'error' }>(), { kind: 'info' })
</script>
