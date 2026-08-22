import { describe, expect, it } from 'vitest'
import {
  computeAccuracy,
  computeJudgementWindows,
  gradeForAccuracy,
  judgeOffset,
  judgementScore,
  nearestExpectedGlobalIndex,
} from './scoring'

describe('computeJudgementWindows', () => {
  it('低速 120BPM（interval 500ms）→ 名义上限 40/80/120', () => {
    const w = computeJudgementWindows(500)
    expect(w.perfect).toBe(40)
    expect(w.great).toBe(80)
    expect(w.good).toBe(120)
  })

  it('高速 240BPM（interval 250ms）窗口随速度收紧', () => {
    const w = computeJudgementWindows(250)
    expect(w.good).toBe(62.5)
    expect(w.perfect).toBe(25)
    expect(w.great).toBe(43.75)
  })
})

describe('judgeOffset', () => {
  const w = computeJudgementWindows(500)

  it('固定偏差命中对应判定区间', () => {
    expect(judgeOffset(0, w)).toBe('perfect')
    expect(judgeOffset(35, w)).toBe('perfect')
    expect(judgeOffset(40, w)).toBe('perfect')
    expect(judgeOffset(41, w)).toBe('great')
    expect(judgeOffset(80, w)).toBe('great')
    expect(judgeOffset(81, w)).toBe('good')
    expect(judgeOffset(120, w)).toBe('good')
    expect(judgeOffset(121, w)).toBe('miss')
    expect(judgeOffset(-130, w)).toBe('miss')
  })
})

describe('judgementScore', () => {
  it('各判定分值 100/85/65/0', () => {
    expect(judgementScore('perfect')).toBe(100)
    expect(judgementScore('great')).toBe(85)
    expect(judgementScore('good')).toBe(65)
    expect(judgementScore('miss')).toBe(0)
  })
})

describe('computeAccuracy', () => {
  it('总分/预期数 计算匹配度', () => {
    expect(computeAccuracy(100, 1)).toBe(100)
    expect(computeAccuracy(85, 1)).toBe(85)
    expect(computeAccuracy(200, 2)).toBe(100)
    expect(computeAccuracy(0, 0)).toBe(0)
  })
})

describe('nearestExpectedGlobalIndex', () => {
  it('窗口内返回最近未消费预期拍', () => {
    expect(nearestExpectedGlobalIndex(10.02, 10, 0.5, 0.12, 0)).toBe(0)
    expect(nearestExpectedGlobalIndex(10.6, 10, 0.5, 0.12, 0)).toBe(1)
  })

  it('太早返回 null；已过期拍跳过', () => {
    expect(nearestExpectedGlobalIndex(9.8, 10, 0.5, 0.12, 0)).toBeNull()
    expect(nearestExpectedGlobalIndex(10.6, 10, 0.5, 0.12, 1)).toBe(1)
  })
})

describe('gradeForAccuracy', () => {
  it('评级边界 S/A/B/C/D', () => {
    expect(gradeForAccuracy(97)).toBe('S')
    expect(gradeForAccuracy(96.9)).toBe('A')
    expect(gradeForAccuracy(90)).toBe('A')
    expect(gradeForAccuracy(89.9)).toBe('B')
    expect(gradeForAccuracy(80)).toBe('B')
    expect(gradeForAccuracy(79.9)).toBe('C')
    expect(gradeForAccuracy(70)).toBe('C')
    expect(gradeForAccuracy(69.9)).toBe('D')
  })
})
