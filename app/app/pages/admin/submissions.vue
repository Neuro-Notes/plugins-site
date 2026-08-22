<template>
  <section class="page-section container">
    <div class="page-heading">
      <span class="eyebrow">Admin</span>
      <h1>{{ $t('moderation.title') }}</h1>
      <p>{{ $t('moderation.description') }}</p>
    </div>
    <AppAlert v-if="errorMessage" kind="error">{{ errorMessage }}</AppAlert>
    <div v-if="submissions?.items.length" class="submission-list">
      <article v-for="submission in submissions.items" :key="submission.id" class="submission-row">
        <div class="submission-heading">
          <strong>{{ submission.manifest.name }} · v{{ submission.manifest.version }}</strong>
          <span class="status">{{ submission.kind }}</span>
        </div>
        <a :href="submission.source.releaseUrl" target="_blank" rel="noreferrer" class="text-link">{{ submission.source.repositoryUrl }}</a>
        <div v-if="submission.warnings.length" class="tag-list">
          <span v-for="warning in submission.warnings" :key="warning.code" class="tag tag-warning">
            {{ $t(`compatibility.warnings.${warning.code}`) }}
          </span>
        </div>
        <div class="field">
          <label :for="`reason-${submission.id}`">{{ $t('moderation.reason') }}</label>
          <textarea :id="`reason-${submission.id}`" v-model="reasons[submission.id]" class="textarea" />
        </div>
        <div class="form-actions">
          <button class="button button-primary" type="button" @click="decide(submission.id, 'approved')">{{ $t('moderation.approve') }}</button>
          <button class="button button-danger" type="button" @click="decide(submission.id, 'rejected')">{{ $t('moderation.reject') }}</button>
        </div>
      </article>
    </div>
    <EmptyState v-else :title="$t('moderation.emptyTitle')" :description="$t('moderation.emptyDescription')" icon="heroicons:check-circle" />
  </section>
</template>

<script setup lang="ts">
import type { SubmissionRecord } from '#shared/marketplace'

definePageMeta({ middleware: 'admin' })
const { t } = useI18n()
const auth = useMarketplaceAuth()
const reasons = reactive<Record<string, string>>({})
const errorMessage = ref('')
const { data: submissions, refresh } = await useFetch<{ items: SubmissionRecord[] }>('/api/v1/admin/submissions', {
  query: { status: 'pending' },
  headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
})

const decide = async (id: string, decision: 'approved' | 'rejected') => {
  errorMessage.value = ''
  try {
    await auth.mutate(`/api/v1/admin/submissions/${id}/decision`, { decision, reason: reasons[id] || '' })
    await refresh()
  } catch (error: any) {
    errorMessage.value = error?.data?.data?.detail || error?.data?.detail || t('common.requestFailed')
  }
}

useSeoMeta({ title: () => t('seo.moderationTitle') })
</script>
