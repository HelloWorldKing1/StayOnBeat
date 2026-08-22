import { describe, expect, it } from 'vitest'
import { estimateTapTempo } from './tapTempo'

describe('estimateTapTempo', () => {
  it('不足 minTaps（4）次点击 bpm 为 null 且不算过快', () => {
    const r = estimateTapTempo([0, 500, 1000])
    expect(r.bpm).toBeNull()
    expect(r.fast).toBe(false)
  })

  it('等间隔 500ms → 120 BPM', () => {
    expect(estimateTapTempo([0, 500, 1000, 1500]).bpm).toBe(120)
  })

  it('抖动样本取中位数不被异常带偏', () => {
    // 间隔：400, 2000, 500, 600 → 中位数 550 → 60000/550≈109
    expect(estimateTapTempo([0, 400, 2400, 2900, 3500]).bpm).toBe(109)
  })

  it('过滤过快异常间隔（<120ms）', () => {
    // 间隔：100(过滤), 500, 500, 500 → [500,500,500] → 中位数 500 → 120
    const r = estimateTapTempo([0, 100, 600, 1100, 1600])
    expect(r.bpm).toBe(120)
    expect(r.fast).toBe(false)
  })

  it('全部过快被过滤时 bpm 为 null 且 fast', () => {
    // 间隔全为 50ms → 过滤为空 → null、fast
    const r = estimateTapTempo([0, 50, 100, 150, 200])
    expect(r.bpm).toBeNull()
    expect(r.fast).toBe(true)
  })

  it('敲击超过 240 BPM 时按 240 计算并标记 fast', () => {
    // 间隔 200ms → 原始 300 BPM → clamp 240、fast=true
    const r = estimateTapTempo([0, 200, 400, 600, 800])
    expect(r.bpm).toBe(240)
    expect(r.fast).toBe(true)
  })

  it('恰好 240 BPM（250ms）不标记 fast', () => {
    const r = estimateTapTempo([0, 250, 500, 750, 1000])
    expect(r.bpm).toBe(240)
    expect(r.fast).toBe(false)
  })
})
