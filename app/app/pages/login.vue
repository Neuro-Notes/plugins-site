<template>
  <section class="page-section narrow-container">
    <div class="page-heading">
      <span class="eyebrow">Neuro Notes</span>
      <h1>{{ $t(totpRequired ? 'auth.totpTitle' : 'auth.title') }}</h1>
      <p>{{ $t(totpRequired ? 'auth.totpDescription' : 'auth.description') }}</p>
    </div>
    <form class="panel form-grid" @submit.prevent="submit">
      <AppAlert v-if="errorMessage" kind="error">{{ errorMessage }}</AppAlert>
      <template v-if="!totpRequired">
        <div class="field">
          <label for="identity">{{ $t('auth.identity') }}</label>
          <input id="identity" v-model="identity" class="input" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="password">{{ $t('auth.password') }}</label>
          <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required>
        </div>
      </template>
      <div v-else class="field">
        <label for="totp">{{ $t('auth.totpCode') }}</label>
        <input id="totp" v-model="totpCode" class="input" inputmode="numeric" autocomplete="one-time-code" required>
      </div>
      <button class="button button-primary" type="submit" :disabled="loading">
        {{ loading ? $t('common.loading') : $t(totpRequired ? 'auth.verify' : 'auth.login') }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useMarketplaceAuth()
const identity = ref('')
const password = ref('')
const totpCode = ref('')
const totpRequired = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const submit = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    if (totpRequired.value) {
      await auth.mutate('/api/v1/auth/totp', { code: totpCode.value })
    } else {
      const response = await auth.mutate<{ authenticated: boolean, requiresTotp: boolean }>('/api/v1/auth/login', {
        identity: identity.value,
        password: password.value
      })
      if (response.requiresTotp) {
        totpRequired.value = true
        return
      }
    }
    await auth.load(true)
    await navigateTo(localePath('/dashboard'))
  } catch (error: any) {
    errorMessage.value = error?.data?.data?.detail || error?.data?.detail || t('auth.failed')
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: () => t('seo.loginTitle') })
</script>
