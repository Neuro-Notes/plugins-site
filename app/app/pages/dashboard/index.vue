<template>
  <section class="page-section container">
    <div class="page-heading">
      <span class="eyebrow">{{ auth.user.value?.username }}</span>
      <h1>{{ $t('dashboard.title') }}</h1>
      <p>{{ $t('dashboard.description') }}</p>
      <div><NuxtLink :to="localePath('/dashboard/submissions/new')" class="button button-primary">{{ $t('dashboard.newSubmission') }}</NuxtLink></div>
    </div>
    <div v-if="submissions?.items.length" class="submission-list">
      <article v-for="submission in submissions.items" :key="submission.id" class="submission-row">
        <div class="submission-heading">
          <strong>{{ submission.manifest.name }} · v{{ submission.manifest.version }}</strong>
          <span class="status" :class="`status-${submission.status}`">{{ $t(`submission.status.${submission.status}`) }}</span>
        </div>
        <span class="muted">{{ submission.pluginId }} · {{ formatDate(submission.submittedAt) }}</span>
        <p v-if="submission.reviewReason">{{ submission.reviewReason }}</p>
        <div v-if="submission.warnings.length" class="tag-list">
          <span class="tag tag-warning">{{ $t('compatibility.warningCount', { count: submission.warnings.length }) }}</span>
        </div>
      </article>
    </div>
    <EmptyState v-else :title="$t('dashboard.emptyTitle')" :description="$t('dashboard.emptyDescription')" />
  </section>
</template>

<script setup lang="ts">
import type { SubmissionRecord } from '#shared/marketplace'

definePageMeta({ middleware: 'auth' })
const { locale, t } = useI18n()
const localePath = useLocalePath()
const auth = useMarketplaceAuth()
await auth.load()
const { data: submissions } = await useFetch<{ items: SubmissionRecord[] }>('/api/v1/me/submissions', {
  headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
})
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(value))
useSeoMeta({ title: () => t('seo.dashboardTitle') })
</script>
