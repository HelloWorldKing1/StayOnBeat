import { expect, test } from '@playwright/test'

test('训练结束（手动停止）显示中止总结', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始训练' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()

  // count-in 结束后停止 → aborted 总结
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByTestId('session-summary')).toBeVisible()
  await expect(page.getByText('已中止')).toBeVisible()
  await expect(page.getByText(/匹配度|评级|最大连击/)).toBeVisible()
})

test('再来一次复用当前设置开启新会话', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始训练' }).click()
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByTestId('session-summary')).toBeVisible()

  await page.getByRole('button', { name: '再来一次' }).click()
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible()
})

test('刷新后历史记录仍存在', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始训练' }).click()
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: '停止' }).click()
  await expect(page.getByTestId('history-panel')).toContainText('共 1 次')

  await page.reload()
  await expect(page.getByTestId('history-panel')).toContainText('共 1 次')
})
