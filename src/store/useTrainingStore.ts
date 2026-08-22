import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand'
import { audioClockBridge, type AudioClockBridge } from '../lib/clock'
import { secondsPerSubdivision, type SubdivisionFactor } from '../lib/tempo'
import {
  computeAccuracy,
  computeJudgementWindows,
  gradeForAccuracy,
  judgeOffset,
  judgementScore,
  nearestExpectedGlobalIndex,
  type Judgement,
} from '../lib/scoring'
import type { MetronomeEngine } from '../engine/metronomeEngine'
import {
  metronomeEngine as defaultMetronomeEngine,
  useMetronomeStore,
} from './useMetronomeStore'

export const MISS_TICK_MS = 50

export type TrainingPhase = 'idle' | 'ready' | 'countIn' | 'training' | 'summary'
export type SessionStatus = 'completed' | 'aborted'

export interface SessionHit {
  expectedBeatIndex: number
  offsetMs: number | null
  judgement: Judgement
}

export interface SessionResult {
  status: SessionStatus
  bpm: number
  beatsPerBar: number
  subdivision: SubdivisionFactor
  durationMs: number
  accuracy: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  maxCombo: number
  avgOffsetMs: number
  stdOffsetMs: number
  earlyRate: number
  lateRate: number
  judgements: Record<Judgement, number>
  hits: SessionHit[]
}

interface SessionRuntime {
  firstScoringTime: number
  bpm: number
  beatsPerBar: number
  subdivision: SubdivisionFactor
  spSub: number
  goodWindowMs: number
  nextExpectedIndex: number
  hits: SessionHit[]
  judgements: Record<Judgement, number>
  combo: number
  maxCombo: number
  totalScore: number
  resolvedCount: number
  earlyCount: number
  lateCount: number
}

type TrainingSettings = Pick<
  ReturnType<typeof useMetronomeStore.getState>,
  'bpm' | 'beatsPerBar' | 'subdivision' | 'countInEnabled'
>

export interface TrainingState {
  phase: TrainingPhase
  session: SessionRuntime | null
  lastJudgement: Judgement | null
  lastOffsetMs: number | null
  result: SessionResult | null
  startTraining(): Promise<void>
  recordHit(perfMs: number): void
  expireMissedBeats(): void
  stopTraining(status: SessionStatus): void
  reset(): void
}

export interface TrainingStoreDeps {
  metronomeEngine?: MetronomeEngine
  audioClockBridge?: AudioClockBridge
  getSettings?: () => TrainingSettings
}

export function createTrainingStore(deps: TrainingStoreDeps = {}) {
  const metronomeEngine = deps.metronomeEngine ?? defaultMetronomeEngine
  const bridge = deps.audioClockBridge ?? audioClockBridge
  const getSettings = deps.getSettings ?? (() => useMetronomeStore.getState())

  let intervalId: ReturnType<typeof setInterval> | null = null
  let unsubscribeOnStopped: (() => void) | null = null

  const creator: StateCreator<TrainingState> = (set, get) => ({
    phase: 'idle',
    session: null,
    lastJudgement: null,
    lastOffsetMs: null,
    result: null,

    async startTraining() {
      const current = get().phase
      if (current === 'training' || current === 'countIn') return
      const settings = getSettings()
      const { bpm, beatsPerBar, subdivision, countInEnabled } = settings

      await metronomeEngine.start()
      const firstBeatTime = metronomeEngine.getFirstBeatTime()
      if (firstBeatTime == null) return

      const spSub = secondsPerSubdivision(bpm, subdivision)
      const countInTicks = countInEnabled ? beatsPerBar * subdivision : 0
      const firstScoringTime = firstBeatTime + countInTicks * spSub

      const session: SessionRuntime = {
        firstScoringTime,
        bpm,
        beatsPerBar,
        subdivision,
        spSub,
        goodWindowMs: computeJudgementWindows(spSub * 1000).good,
        nextExpectedIndex: 0,
        hits: [],
        judgements: { perfect: 0, great: 0, good: 0, miss: 0 },
        combo: 0,
        maxCombo: 0,
        totalScore: 0,
        resolvedCount: 0,
        earlyCount: 0,
        lateCount: 0,
      }

      // 计时器到点自动停止 → completed（引擎已自停）
      unsubscribeOnStopped?.()
      unsubscribeOnStopped = metronomeEngine.addOnStopped(() => {
        get().stopTraining('completed')
      })

      set({
        phase: countInEnabled ? 'countIn' : 'training',
        session,
        lastJudgement: null,
        lastOffsetMs: null,
        result: null,
      })

      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(() => get().expireMissedBeats(), MISS_TICK_MS)
    },

    recordHit(perfMs) {
      const s = get().session
      if (get().phase !== 'training' || !s) return
      const audioNow = bridge.perfMsToAudio(perfMs)
      const windows = computeJudgementWindows(s.spSub * 1000)
      const idx = nearestExpectedGlobalIndex(
        audioNow,
        s.firstScoringTime,
        s.spSub,
        windows.good / 1000,
        s.nextExpectedIndex,
      )
      if (idx == null) return // 冗余/太早
      const expectedTime = s.firstScoringTime + idx * s.spSub
      const offsetMs = (audioNow - expectedTime) * 1000
      const j = judgeOffset(offsetMs, windows)
      const combo = j === 'miss' ? 0 : s.combo + 1
      const next: SessionRuntime = {
        ...s,
        hits: [...s.hits, { expectedBeatIndex: idx, offsetMs, judgement: j }],
        judgements: { ...s.judgements, [j]: s.judgements[j] + 1 },
        combo,
        maxCombo: Math.max(s.maxCombo, combo),
        totalScore: s.totalScore + judgementScore(j),
        resolvedCount: s.resolvedCount + 1,
        nextExpectedIndex: idx + 1,
        earlyCount: s.earlyCount + (offsetMs < 0 ? 1 : 0),
        lateCount: s.lateCount + (offsetMs > 0 ? 1 : 0),
      }
      set({ session: next, lastJudgement: j, lastOffsetMs: offsetMs })
    },

    expireMissedBeats() {
      const s = get().session
      if (!s) return
      const audioNow = metronomeEngine.currentAudioTime()
      if (get().phase === 'countIn' && audioNow >= s.firstScoringTime) {
        set({ phase: 'training' })
      }
      if (get().phase !== 'training') return
      const goodWindowSec = s.goodWindowMs / 1000
      let next = s
      while (
        next.firstScoringTime + next.nextExpectedIndex * next.spSub + goodWindowSec <
        audioNow
      ) {
        const idx = next.nextExpectedIndex
        next = {
          ...next,
          hits: [
            ...next.hits,
            { expectedBeatIndex: idx, offsetMs: null, judgement: 'miss' },
          ],
          judgements: { ...next.judgements, miss: next.judgements.miss + 1 },
          combo: 0,
          resolvedCount: next.resolvedCount + 1,
          nextExpectedIndex: idx + 1,
        }
      }
      if (next !== s) set({ session: next })
    },

    stopTraining(status) {
      const current = get().phase
      if (current !== 'training' && current !== 'countIn') return
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      unsubscribeOnStopped?.()
      unsubscribeOnStopped = null
      if (!get().session) {
        set({ phase: 'summary' })
        return
      }
      // 补齐未结算拍，再读取最终 session 结算
      get().expireMissedBeats()
      const final = get().session!
      const result = computeResult(final, status, metronomeEngine.currentAudioTime())
      set({ phase: 'summary', session: final, result })
    },

    reset() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      unsubscribeOnStopped?.()
      unsubscribeOnStopped = null
      set({
        phase: 'idle',
        session: null,
        lastJudgement: null,
        lastOffsetMs: null,
        result: null,
      })
    },
  })

  return create<TrainingState>()(creator)
}

function computeResult(
  session: SessionRuntime,
  status: SessionStatus,
  endAudioTime: number,
): SessionResult {
  const scored = session.hits.filter((h) => h.offsetMs != null)
  const hitCount = scored.length
  const avgOffsetMs = hitCount
    ? scored.reduce((acc, h) => acc + Math.abs(h.offsetMs!), 0) / hitCount
    : 0
  const variance = hitCount
    ? scored.reduce((acc, h) => acc + (Math.abs(h.offsetMs!) - avgOffsetMs) ** 2, 0) /
      hitCount
    : 0
  const earlyRate = hitCount ? session.earlyCount / hitCount : 0
  const lateRate = hitCount ? session.lateCount / hitCount : 0
  const accuracy = computeAccuracy(session.totalScore, session.resolvedCount)
  return {
    status,
    bpm: session.bpm,
    beatsPerBar: session.beatsPerBar,
    subdivision: session.subdivision,
    durationMs: Math.max(0, (endAudioTime - session.firstScoringTime) * 1000),
    accuracy,
    grade: gradeForAccuracy(accuracy),
    maxCombo: session.maxCombo,
    avgOffsetMs,
    stdOffsetMs: Math.sqrt(variance),
    earlyRate,
    lateRate,
    judgements: { ...session.judgements },
    hits: [...session.hits],
  }
}

/** 应用单例（运行时状态，不持久化）。 */
export const useTrainingStore: UseBoundStore<StoreApi<TrainingState>> =
  createTrainingStore()
