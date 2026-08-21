import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BEATS_PER_BAR,
  DEFAULT_BPM,
  MAX_BEATS_PER_BAR,
  MAX_BPM,
  MIN_BEATS_PER_BAR,
  MIN_BPM,
  clampBeatsPerBar,
  clampBpm,
  secondsPerBeat,
  secondsPerSubdivision,
  tempoMarking,
} from './tempo'

describe('tempo 常量', () => {
  it('BPM 边界为 1–240，默认 120', () => {
    expect(MIN_BPM).toBe(1)
    expect(MAX_BPM).toBe(240)
    expect(DEFAULT_BPM).toBe(120)
  })

  it('每小节拍数边界为 1–12，默认 4', () => {
    expect(MIN_BEATS_PER_BAR).toBe(1)
    expect(MAX_BEATS_PER_BAR).toBe(12)
    expect(DEFAULT_BEATS_PER_BAR).toBe(4)
  })
})

describe('secondsPerBeat', () => {
  it('120 BPM 每拍 0.5 秒', () => {
    expect(secondsPerBeat(120)).toBe(0.5)
  })

  it('60 BPM 每拍 1 秒，240 BPM 每拍 0.25 秒', () => {
    expect(secondsPerBeat(60)).toBe(1)
    expect(secondsPerBeat(240)).toBe(0.25)
  })

  it('非法 BPM 抛 RangeError', () => {
    expect(() => secondsPerBeat(0)).toThrow(RangeError)
    expect(() => secondsPerBeat(-10)).toThrow(RangeError)
    expect(() => secondsPerBeat(Number.NaN)).toThrow(RangeError)
    expect(() => secondsPerBeat(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('secondsPerSubdivision', () => {
  it('默认按四分音符（factor=1）计算', () => {
    expect(secondsPerSubdivision(120)).toBe(0.5)
  })

  it('细分因子按比例细分', () => {
    expect(secondsPerSubdivision(120, 2)).toBe(0.25)
    expect(secondsPerSubdivision(120, 3)).toBeCloseTo(1 / 6)
    expect(secondsPerSubdivision(120, 4)).toBe(0.125)
  })
})

describe('clampBpm', () => {
  it('夹取到 1–240', () => {
    expect(clampBpm(0)).toBe(1)
    expect(clampBpm(-5)).toBe(1)
    expect(clampBpm(241)).toBe(240)
    expect(clampBpm(999)).toBe(240)
    expect(clampBpm(120)).toBe(120)
  })

  it('取整到最近整数', () => {
    expect(clampBpm(120.6)).toBe(121)
    expect(clampBpm(120.4)).toBe(120)
  })

  it('非有限值回退默认 120', () => {
    expect(clampBpm(Number.NaN)).toBe(DEFAULT_BPM)
    expect(clampBpm(Number.POSITIVE_INFINITY)).toBe(DEFAULT_BPM)
  })
})

describe('clampBeatsPerBar', () => {
  it('夹取到 1–12', () => {
    expect(clampBeatsPerBar(0)).toBe(1)
    expect(clampBeatsPerBar(13)).toBe(12)
    expect(clampBeatsPerBar(4)).toBe(4)
  })

  it('非有限值回退默认 4', () => {
    expect(clampBeatsPerBar(Number.NaN)).toBe(DEFAULT_BEATS_PER_BAR)
  })
})

describe('tempoMarking', () => {
  it('120 BPM → 中板 Moderato', () => {
    expect(tempoMarking(120)).toEqual({ zh: '中板', en: 'Moderato' })
  })

  it('区间边界划分正确', () => {
    expect(tempoMarking(59)).toEqual({ zh: '广板', en: 'Largo' })
    expect(tempoMarking(60)).toEqual({ zh: '柔板', en: 'Adagio' })
    expect(tempoMarking(75)).toEqual({ zh: '柔板', en: 'Adagio' })
    expect(tempoMarking(76)).toEqual({ zh: '行板', en: 'Andante' })
    expect(tempoMarking(107)).toEqual({ zh: '行板', en: 'Andante' })
    expect(tempoMarking(108)).toEqual({ zh: '中板', en: 'Moderato' })
    expect(tempoMarking(121)).toEqual({ zh: '快板', en: 'Allegro' })
    expect(tempoMarking(167)).toEqual({ zh: '快板', en: 'Allegro' })
    expect(tempoMarking(168)).toEqual({ zh: '急板', en: 'Presto' })
    expect(tempoMarking(240)).toEqual({ zh: '急板', en: 'Presto' })
  })

  it('越界值先夹取再查表', () => {
    expect(tempoMarking(0)).toEqual({ zh: '广板', en: 'Largo' })
    expect(tempoMarking(500)).toEqual({ zh: '急板', en: 'Presto' })
    expect(tempoMarking(Number.NaN)).toEqual({ zh: '中板', en: 'Moderato' })
  })
})
