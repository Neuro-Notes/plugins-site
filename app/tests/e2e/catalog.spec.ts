import { expect, test } from '@playwright/test'

test('empty catalog and documentation navigation are available', async ({ page }) => {
  await page.goto('/plugins')
  await expect(page.getByRole('heading', { name: 'Каталог' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Опубликованных плагинов пока нет' })).toBeVisible()

  await page.getByRole('contentinfo').getByRole('link', { name: 'Разработчикам' }).click()
  await expect(page).toHaveURL(/\/docs\/ru\/$/)
  await expect(page.getByRole('heading', { name: 'Документация разработчика' })).toBeVisible()
})

test('legacy documentation URLs redirect to canonical locales', async ({ page }) => {
  await page.goto('/docs')
  await expect(page).toHaveURL(/\/docs\/ru\/$/)

  await page.goto('/docs/quickstart')
  await expect(page).toHaveURL(/\/docs\/ru\/quickstart$/)

  await page.goto('/en/docs/runtime')
  await expect(page).toHaveURL(/\/docs\/en\/runtime$/)
})

test('English documentation supports local search and catalog return', async ({ page }) => {
  await page.goto('/docs/en/')
  await expect(page.getByRole('heading', { name: 'Developer documentation' })).toBeVisible()

  await page.getByRole('button', { name: /Search/ }).click()
  await page.locator('input[type="search"]').fill('globalThis.neuroNotesPlugin')
  await page.getByRole('listbox').getByRole('link', { name: 'Quick start' }).click()
  await expect(page.getByRole('heading', { name: 'Quick start' })).toBeVisible()
  await expect(page.getByText('globalThis.neuroNotesPlugin')).toBeVisible()

  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'mobile navigation' }).click()
  }
  await page.getByRole('link', { name: 'Catalog' }).click()
  await expect(page).toHaveURL(/\/en\/plugins$/)
})

test('theme selection persists between the marketplace and documentation', async ({ page }) => {
  await page.goto('/plugins')
  const initiallyDark = await page.locator('html').evaluate(element => element.classList.contains('dark'))
  await page.getByRole('button', { name: 'Переключить тему' }).click()
  const expectedTheme = initiallyDark ? 'light' : 'dark'
  await expect.poll(() => page.evaluate(() => localStorage.getItem('neuro-notes-marketplace-theme'))).toBe(expectedTheme)

  await page.goto('/docs/ru/')
  await expect(page.locator('html')).toHaveClass(new RegExp(`(^|\\s)${expectedTheme}(\\s|$)`))
})
