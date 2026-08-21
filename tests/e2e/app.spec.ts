import { expect, test } from '@playwright/test'

test('renders the StayOnBeat M0 baseline', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'StayOnBeat' })).toBeVisible()
  await expect(page.getByText(/M0 工程基线已就绪/)).toBeVisible()
})
