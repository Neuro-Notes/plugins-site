export default defineNuxtRouteMiddleware(async () => {
  const auth = useMarketplaceAuth()
  await auth.load()
  if (!auth.user.value) return navigateTo(useLocalePath()('/login'))
})
