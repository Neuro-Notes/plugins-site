export const useDocsUrl = () => {
  const { locale } = useI18n()

  return computed(() => `/docs/${locale.value}/`)
}
