import { clampBpm } from './tempo'

export const MIN_TAP_INTERVAL_MS = 200
export const MAX_TAP_INTERVAL_MS = 3000

/**
 * 由点击时间戳估算 BPM：过滤 200–3000ms 间隔，取中位数抗抖动。
 * 有效间隔不足 minTaps-1 个（即不足 minTaps 次点击）时返回 null。
 */
export function estimateTapTempo(
  tapTimesMs: readonly number[],
  minTaps = 4,
): number | null {
  const intervals: number[] = []
  for (let i = 1; i < tapTimesMs.length; i++) {
    const gap = tapTimesMs[i] - tapTimesMs[i - 1]
    if (gap >= MIN_TAP_INTERVAL_MS && gap <= MAX_TAP_INTERVAL_MS) {
      intervals.push(gap)
    }
  }
  if (intervals.length < minTaps - 1) return null

  intervals.sort((a, b) => a - b)
  const mid = Math.floor(intervals.length / 2)
  const median =
    intervals.length % 2 === 0
      ? (intervals[mid - 1] + intervals[mid]) / 2
      : intervals[mid]

  return clampBpm(Math.round(60000 / median))
}
