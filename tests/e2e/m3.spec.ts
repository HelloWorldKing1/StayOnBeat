import { expect, test } from '@playwright/test'

test('训练流程：开始训练 → 训练垫可见 → 停止回到初始', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible()

  await page.getByRole('button', { name: '开始训练' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()
  await expect(page.getByLabel('训练点击垫')).toBeVisible()
  await expect(page.getByTestId('score-hud')).toBeVisible()

  // count-in 后训练垫可输入（1 小节 ≈ 2s @120bpm）
  await page.waitForTimeout(2500)
  await page.getByLabel('训练点击垫').click()
  await expect(page.getByTestId('judgement')).toBeVisible({ timeout: 2000 })

  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible()
})

test('训练中设置锁定（BPM/拍号禁用）', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始训练' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()

  await expect(page.getByRole('button', { name: '提高 BPM' })).toBeDisabled()
  await expect(page.getByLabel('每小节拍数')).toBeDisabled()
})

test('模式切换：训练 ↔ 节拍器', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible()

  await page.getByRole('button', { name: '切换节拍器' }).click()
  await expect(page.getByRole('button', { name: '开始' })).toBeVisible()

  await page.getByRole('button', { name: '切换训练模式' }).click()
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible()
})
