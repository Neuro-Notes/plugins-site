import type { MarketplaceUser } from '#shared/marketplace'

export const useMarketplaceAuth = () => {
  const user = useState<MarketplaceUser | null>('marketplace-user', () => null)
  const csrfToken = useState('marketplace-csrf', () => '')
  const loaded = useState('marketplace-auth-loaded', () => false)

  const requestHeaders = () => import.meta.server ? useRequestHeaders(['cookie']) : undefined

  const load = async (force = false) => {
    if (loaded.value && !force) return user.value
    try {
      const response = await $fetch<{ authenticated: boolean, user: MarketplaceUser | null, csrfToken: string }>('/api/v1/auth/session', {
        headers: requestHeaders()
      })
      user.value = response.user
      csrfToken.value = response.csrfToken
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
    return user.value
  }

  const ensureCsrf = async () => {
    if (csrfToken.value) return csrfToken.value
    const response = await $fetch<{ csrfToken: string }>('/api/v1/auth/csrf')
    csrfToken.value = response.csrfToken
    return csrfToken.value
  }

  const mutate = async <T>(url: string, body?: unknown, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST') => (
    await $fetch<T>(url, {
      method,
      body: body as Record<string, unknown> | undefined,
      headers: { 'x-csrf-token': await ensureCsrf() }
    })
  )

  const logout = async () => {
    await mutate('/api/v1/auth/logout')
    user.value = null
    csrfToken.value = ''
    loaded.value = true
  }

  return { user, csrfToken, loaded, load, ensureCsrf, mutate, logout }
}
