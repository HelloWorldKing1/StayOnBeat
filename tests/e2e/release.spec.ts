import { expect, test } from '@playwright/test'

test('发布核心闭环：训练→总结→历史→刷新仍在', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始训练' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()

  // count-in（约 2s @120bpm）后停止 → 中止总结
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByTestId('session-summary')).toBeVisible()

  // 历史面板记录 +1
  await expect(page.getByTestId('history-panel')).toContainText('共 1 次')

  // 刷新后历史仍在（IndexedDB）
  await page.reload()
  await expect(page.getByTestId('history-panel')).toContainText('共 1 次')
})

test('节拍器模式可播放（冒烟）', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '切换节拍器' }).click()
  await page.getByRole('button', { name: '开始' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()
  await expect(page.getByTestId('beat-light')).toHaveCount(4)
})
