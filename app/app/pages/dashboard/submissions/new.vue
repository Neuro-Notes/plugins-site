<template>
  <section class="page-section narrow-container">
    <div class="page-heading">
      <span class="eyebrow">GitHub</span>
      <h1>{{ $t('publish.title') }}</h1>
      <p>{{ $t('publish.description') }}</p>
    </div>
    <form class="panel form-grid" @submit.prevent="publish">
      <AppAlert v-if="errorMessage" kind="error">{{ errorMessage }}</AppAlert>
      <AppAlert v-if="validated" :kind="validated.warnings.length ? 'warning' : 'info'">
        <strong>{{ validated.manifest.name }} · v{{ validated.manifest.version }}</strong>
        <div v-if="validated.warnings.length">
          {{ $t('compatibility.warningCount', { count: validated.warnings.length }) }}
        </div>
      </AppAlert>
      <div class="field">
        <label for="kind">{{ $t('publish.kind') }}</label>
        <select id="kind" v-model="form.kind" class="select">
          <option value="new_plugin">{{ $t('publish.kinds.new_plugin') }}</option>
          <option value="new_version">{{ $t('publish.kinds.new_version') }}</option>
          <option value="metadata_update">{{ $t('publish.kinds.metadata_update') }}</option>
        </select>
      </div>
      <div class="field">
        <label for="repository">{{ $t('publish.repository') }}</label>
        <input id="repository" v-model="form.repositoryUrl" class="input" type="url" placeholder="https://github.com/owner/repository" required>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="release-tag">{{ $t('publish.releaseTag') }}</label>
          <input id="release-tag" v-model="form.releaseTag" class="input" placeholder="v1.0.0" required>
        </div>
        <div class="field">
          <label for="manifest-path">{{ $t('publish.manifestPath') }}</label>
          <input id="manifest-path" v-model="form.manifestPath" class="input" placeholder="manifest.json" required>
        </div>
      </div>
      <fieldset class="field">
        <legend>{{ $t('publish.categories') }}</legend>
        <div class="checkbox-grid">
          <label v-for="category in marketplaceCategories" :key="category" class="checkbox">
            <input v-model="form.categories" type="checkbox" :value="category" :disabled="!form.categories.includes(category) && form.categories.length >= 3">
            {{ $t(`categories.${category}`) }}
          </label>
        </div>
      </fieldset>
      <h2>{{ $t('publish.translations') }}</h2>
      <div class="form-row">
        <div class="field">
          <label for="summary-ru">{{ $t('publish.summaryRu') }}</label>
          <input id="summary-ru" v-model="form.translations.ru.summary" class="input" maxlength="240">
        </div>
        <div class="field">
          <label for="summary-en">{{ $t('publish.summaryEn') }}</label>
          <input id="summary-en" v-model="form.translations.en.summary" class="input" maxlength="240">
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="description-ru">{{ $t('publish.descriptionRu') }}</label>
          <textarea id="description-ru" v-model="form.translations.ru.description" class="textarea" />
        </div>
        <div class="field">
          <label for="description-en">{{ $t('publish.descriptionEn') }}</label>
          <textarea id="description-en" v-model="form.translations.en.description" class="textarea" />
        </div>
      </div>
      <div class="form-actions">
        <button class="button button-secondary" type="button" :disabled="loading" @click="validate">{{ $t('publish.validate') }}</button>
        <button class="button button-primary" type="submit" :disabled="loading || !validated">{{ $t('publish.submit') }}</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { marketplaceCategories, type GitHubSource, type SubmissionInput } from '#shared/marketplace'
import type { CompatibilityWarning } from '#shared/plugin-contract/capabilities'
import type { PluginManifest } from '#shared/plugin-contract/manifest'

interface ValidatedGitHubPlugin {
  source: GitHubSource
  manifest: PluginManifest
  warnings: CompatibilityWarning[]
}

definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useMarketplaceAuth()
const loading = ref(false)
const errorMessage = ref('')
const validated = ref<ValidatedGitHubPlugin | null>(null)
const form = reactive({
  kind: 'new_plugin' as SubmissionInput['kind'],
  repositoryUrl: '',
  releaseTag: '',
  manifestPath: 'manifest.json',
  categories: [] as SubmissionInput['categories'],
  translations: {
    ru: { summary: '', description: '' },
    en: { summary: '', description: '' }
  }
})

watch(form, () => { validated.value = null }, { deep: true })

const requestBody = (): SubmissionInput => JSON.parse(JSON.stringify(form))
const describeError = (error: any) => error?.data?.data?.detail || error?.data?.detail || t('common.requestFailed')

const validate = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    validated.value = await auth.mutate<ValidatedGitHubPlugin>('/api/v1/submissions/validate', requestBody())
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    loading.value = false
  }
}

const publish = async () => {
  if (!validated.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await auth.mutate('/api/v1/submissions', requestBody())
    await navigateTo(localePath('/dashboard'))
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: () => t('seo.publishTitle') })
</script>
