import { expect, test } from '@playwright/test'

test('renders the StayOnBeat metronome home', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('120')).toBeVisible()
  await expect(page.getByRole('button', { name: '开始' })).toBeVisible()
  await expect(page.getByTestId('beat-light')).toHaveCount(4)
})
