import { describe, expect, it } from 'vitest'
import { INPUT_DEDUPE_WINDOW_MS, normalizeEventTimeMs, shouldDedupe } from './input'

describe('normalizeEventTimeMs', () => {
  it('performance-relative 时间戳原样返回', () => {
    expect(normalizeEventTimeMs(1234)).toBe(1234)
  })

  it('epoch 时间戳换算为 performance-relative', () => {
    const nowPerf = 5000
    const nowEpoch = Date.now()
    const ts = 1000 + (nowEpoch - nowPerf)
    const result = normalizeEventTimeMs(ts, nowPerf)
    expect(result).toBeGreaterThan(990)
    expect(result).toBeLessThan(1010)
  })
})

describe('shouldDedupe', () => {
  it('窗口内去重、窗口边界放行、无前值放行', () => {
    expect(shouldDedupe(1000, 1030)).toBe(true)
    expect(shouldDedupe(1000, 1000 + INPUT_DEDUPE_WINDOW_MS)).toBe(false)
    expect(shouldDedupe(null, 1000)).toBe(false)
  })
})
