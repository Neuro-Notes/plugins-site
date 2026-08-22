export default defineNuxtRouteMiddleware(async () => {
  const auth = useMarketplaceAuth()
  await auth.load()
  if (!auth.user.value) return navigateTo(useLocalePath()('/login'))
  if (!auth.user.value.isAdmin) return abortNavigation(createError({ statusCode: 403, statusMessage: 'Administrator access required' }))
})
