export type Judgement = 'perfect' | 'great' | 'good' | 'miss'

/** 判定窗口（毫秒）。 */
export interface JudgementWindows {
  perfect: number
  great: number
  good: number
}

/**
 * 按细分间隔动态收紧判定窗口。
 * @param intervalMs 每细分单位毫秒 = 1000 * secondsPerSubdivision(bpm, subdivision)
 */
export function computeJudgementWindows(intervalMs: number): JudgementWindows {
  const good = Math.min(120, intervalMs * 0.25)
  return {
    perfect: Math.min(40, good * 0.4),
    great: Math.min(80, good * 0.7),
    good,
  }
}

/** 按偏差毫秒返回判定；超出 goodWindow 为 Miss。 */
export function judgeOffset(offsetMs: number, w: JudgementWindows): Judgement {
  const abs = Math.abs(offsetMs)
  if (abs <= w.perfect) return 'perfect'
  if (abs <= w.great) return 'great'
  if (abs <= w.good) return 'good'
  return 'miss'
}

export function judgementScore(j: Judgement): number {
  switch (j) {
    case 'perfect':
      return 100
    case 'great':
      return 85
    case 'good':
      return 65
    case 'miss':
      return 0
  }
}

/** 匹配度 = 总分 / (预期拍数 * 100) * 100。 */
export function computeAccuracy(totalScore: number, expectedCount: number): number {
  if (expectedCount <= 0) return 0
  return (totalScore / (expectedCount * 100)) * 100
}

/**
 * 从 nextIndex 起找最近「未消费」且落在 goodWindow 内的预期拍。
 * 太早（早于窗口）返回 null（视为冗余）；已过期拍跳过（由 Miss tick 结算）。
 */
export function nearestExpectedGlobalIndex(
  inputAudio: number,
  firstScoringTime: number,
  spSub: number,
  goodWindowSec: number,
  nextIndex: number,
): number | null {
  let i = nextIndex
  for (let guard = 0; guard < 3; guard++, i++) {
    const expected = firstScoringTime + i * spSub
    const offset = inputAudio - expected
    if (offset > goodWindowSec) continue
    if (offset < -goodWindowSec) return null
    return i
  }
  return null
}

export function gradeForAccuracy(accuracy: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (accuracy >= 97) return 'S'
  if (accuracy >= 90) return 'A'
  if (accuracy >= 80) return 'B'
  if (accuracy >= 70) return 'C'
  return 'D'
}
