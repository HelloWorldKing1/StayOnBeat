import { describe, expect, it } from 'vitest'
import { estimateTapTempo } from './tapTempo'

describe('estimateTapTempo', () => {
  it('不足 minTaps（4）次点击返回 null', () => {
    expect(estimateTapTempo([0, 500, 1000])).toBeNull()
  })

  it('等间隔 500ms → 120 BPM', () => {
    expect(estimateTapTempo([0, 500, 1000, 1500])).toBe(120)
  })

  it('抖动样本取中位数不被异常带偏', () => {
    // 间隔：400, 2000, 500, 600 → 中位数 550 → 60000/550≈109
    expect(estimateTapTempo([0, 400, 2400, 2900, 3500])).toBe(109)
  })

  it('过滤 <200ms 的异常间隔', () => {
    // 间隔：150(过滤), 500, 500, 600 → [500,500,600] → 中位数 500 → 120
    expect(estimateTapTempo([0, 150, 650, 1150, 1750])).toBe(120)
  })

  it('clamp 到 240', () => {
    expect(estimateTapTempo([0, 250, 500, 750, 1000])).toBe(240)
  })
})
