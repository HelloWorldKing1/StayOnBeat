import { MAX_BPM, clampBpm } from './tempo'

// 过快下限：< 120ms 视为双击误触（约 500 BPM 以上，远超 240 上限）
export const MIN_TAP_INTERVAL_MS = 120
export const MAX_TAP_INTERVAL_MS = 3000

export interface TapTempoResult {
  /** 估算 BPM（已夹取 1–240）；有效样本不足时为 null。 */
  bpm: number | null
  /** 是否敲得过快：原始中位数 BPM 超过 240，或样本全部被过快过滤。 */
  fast: boolean
}

/**
 * 由点击时间戳估算 BPM：过滤 120–3000ms 间隔，取中位数抗抖动。
 * 有效间隔不足 minTaps-1 个（即不足 minTaps 次有效点击）时 bpm 为 null。
 */
export function estimateTapTempo(
  tapTimesMs: readonly number[],
  minTaps = 4,
): TapTempoResult {
  const rawIntervals: number[] = []
  for (let i = 1; i < tapTimesMs.length; i++) {
    rawIntervals.push(tapTimesMs[i] - tapTimesMs[i - 1])
  }
  const intervals = rawIntervals.filter(
    (gap) => gap >= MIN_TAP_INTERVAL_MS && gap <= MAX_TAP_INTERVAL_MS,
  )
  if (intervals.length < minTaps - 1) {
    // 已点够次数但全部被过快过滤 → fast=true；否则只是样本不足
    return { bpm: null, fast: rawIntervals.length >= minTaps - 1 }
  }

  intervals.sort((a, b) => a - b)
  const mid = Math.floor(intervals.length / 2)
  const median =
    intervals.length % 2 === 0
      ? (intervals[mid - 1] + intervals[mid]) / 2
      : intervals[mid]

  const rawBpm = 60000 / median
  return { bpm: clampBpm(Math.round(rawBpm)), fast: rawBpm > MAX_BPM }
}
