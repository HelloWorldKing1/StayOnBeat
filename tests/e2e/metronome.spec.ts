import { expect, test } from '@playwright/test'

test('节拍器基础交互：BPM、拍号、开始/停止与拍灯脉冲', async ({ page }) => {
  await page.goto('/')

  // 初始状态：BPM 120、拍号 4、开始按钮
  await expect(page.getByText('120')).toBeVisible()
  await expect(page.getByRole('button', { name: '开始' })).toBeVisible()

  // BPM + 按钮步进到 121
  await page.getByRole('button', { name: '提高 BPM' }).click()
  await expect(page.getByText('121')).toBeVisible()

  // 拍号切到 3
  await page.getByLabel('每小节拍数').selectOption('3')

  // 开始（用户手势）→ 显示停止、拍灯数量为 3
  await page.getByRole('button', { name: '开始' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()
  await expect(page.getByTestId('beat-light')).toHaveCount(3)

  // 调度循环在跑：有灯处于点亮状态
  await expect
    .poll(
      () => page.locator('[data-testid="beat-light"][data-active="true"]').count(),
      { timeout: 3000 },
    )
    .toBeGreaterThan(0)

  // 活跃拍灯随时间切换（证明节拍推进）
  const firstActive = await page
    .locator('[data-testid="beat-light"][data-active="true"]')
    .getAttribute('data-index')
  await page.waitForTimeout(1300)
  const nextActive = await page
    .locator('[data-testid="beat-light"][data-active="true"]')
    .getAttribute('data-index')
  expect(nextActive).not.toBe(firstActive)

  // 停止 → 回到开始态
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByRole('button', { name: '开始' })).toBeVisible()
})
