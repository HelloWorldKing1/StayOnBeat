/** BPM 边界常量（与产品设计一致：1–240，默认 120）。 */
export const MIN_BPM = 1
export const MAX_BPM = 240
export const DEFAULT_BPM = 120

/** 每小节拍数边界（1–12，默认 4）。 */
export const MIN_BEATS_PER_BAR = 1
export const MAX_BEATS_PER_BAR = 12
export const DEFAULT_BEATS_PER_BAR = 4

/** 细分因子：1=四分，2=八分，3=三连音，4=十六分。 */
export type SubdivisionFactor = 1 | 2 | 3 | 4

/** 可选的细分档位（M2 起用于细分选择）。 */
export const SUBDIVISIONS: readonly SubdivisionFactor[] = [1, 2, 3, 4]

export interface SubdivisionLabel {
  zh: string
  en: string
}

const SUBDIVISION_LABELS: Record<SubdivisionFactor, SubdivisionLabel> = {
  1: { zh: '四分', en: 'Quarter' },
  2: { zh: '八分', en: 'Eighth' },
  3: { zh: '三连音', en: 'Triplet' },
  4: { zh: '十六分', en: 'Sixteenth' },
}

/** 细分档位的中英文标签。 */
export function subdivisionLabel(sub: SubdivisionFactor): SubdivisionLabel {
  return SUBDIVISION_LABELS[sub]
}

export interface TempoMarking {
  zh: string
  en: string
}

interface TempoMarkingRange {
  min: number
  max: number
  mark: TempoMarking
}

const TEMPO_MARKINGS: TempoMarkingRange[] = [
  { min: Number.NEGATIVE_INFINITY, max: 60, mark: { zh: '广板', en: 'Largo' } },
  { min: 60, max: 76, mark: { zh: '柔板', en: 'Adagio' } },
  { min: 76, max: 108, mark: { zh: '行板', en: 'Andante' } },
  // [108, 121) 使 120 → Moderato，与产品 mock 中的 120 / Moderato 一致
  { min: 108, max: 121, mark: { zh: '中板', en: 'Moderato' } },
  { min: 121, max: 168, mark: { zh: '快板', en: 'Allegro' } },
  { min: 168, max: Number.POSITIVE_INFINITY, mark: { zh: '急板', en: 'Presto' } },
]

/**
 * 每拍秒数。
 * @throws {RangeError} bpm 非有限或 ≤ 0 时抛出。
 */
export function secondsPerBeat(bpm: number): number {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    throw new RangeError(`bpm 必须为正数，收到 ${bpm}`)
  }
  return 60 / bpm
}

/**
 * 每个细分单位秒数。
 * @param subdivision 细分因子，默认四分（1）。
 */
export function secondsPerSubdivision(
  bpm: number,
  subdivision: SubdivisionFactor = 1,
): number {
  return secondsPerBeat(bpm) / subdivision
}

/** BPM 取整并夹取到 1–240；非有限值回退默认 120。 */
export function clampBpm(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)))
}

/** 每小节拍数取整并夹取到 1–12；非有限值回退默认 4。 */
export function clampBeatsPerBar(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BEATS_PER_BAR
  return Math.min(MAX_BEATS_PER_BAR, Math.max(MIN_BEATS_PER_BAR, Math.round(value)))
}

/** 根据 BPM 返回速度术语（中文 + 英文）；越界值先夹取再查表。 */
export function tempoMarking(bpm: number): TempoMarking {
  const safe = clampBpm(bpm)
  const found = TEMPO_MARKINGS.find(({ min, max }) => safe >= min && safe < max)
  return found?.mark ?? TEMPO_MARKINGS[TEMPO_MARKINGS.length - 1].mark
}
