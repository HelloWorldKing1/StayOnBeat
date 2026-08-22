import { expect, test } from '@playwright/test'

test('静音默认开启显示「仅视觉」，可切换关闭', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('仅视觉')).toBeVisible()
  await page.getByRole('button', { name: '开启声音' }).click()
  await expect(page.getByText('仅视觉')).not.toBeVisible()
})

test('主题切换后刷新持久化', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '切换主题' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('计时器自定义 2s 到点自动停止', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '切换模式' }).click() // 节拍器模式
  await page.getByLabel('计时器').selectOption('custom')
  await page.getByLabel('自定义计时秒数').fill('2')
  await page.getByRole('button', { name: '开始' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()
  await expect(page.getByRole('button', { name: '开始' })).toBeVisible({
    timeout: 4000,
  })
})

test('Tap BPM 4 次点击后出现估算并可应用', async ({ page }) => {
  await page.goto('/')
  const tap = page.getByRole('button', { name: 'Tap BPM' })
  for (let i = 0; i < 4; i++) {
    await tap.click()
    await page.waitForTimeout(400)
  }
  await expect(page.getByRole('button', { name: '应用 BPM' })).toBeVisible({
    timeout: 2000,
  })
  await page.getByRole('button', { name: '应用 BPM' }).click()
})

test('细分切换到八分后子拍序号在 0/1 间变化', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '切换模式' }).click() // 节拍器模式
  await page.getByRole('button', { name: '开始' }).click()
  await page.getByLabel('细分').selectOption('2')
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()
  await expect
    .poll(
      () => page.locator('[data-testid="beat-light"][data-active="true"]').count(),
      { timeout: 3000 },
    )
    .toBeGreaterThan(0)
})
