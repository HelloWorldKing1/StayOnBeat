import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClockBridge, type AudioClockBridge } from '../lib/clock'
import type { MetronomeEngine } from '../engine/metronomeEngine'
import { createTrainingStore, type TrainingStoreDeps } from './useTrainingStore'

afterEach(() => {
  vi.restoreAllMocks()
})

function createHarness(
  opts: {
    countInEnabled?: boolean
    bpm?: number
    beatsPerBar?: number
    subdivision?: 1 | 2 | 3 | 4
  } = {},
) {
  const { countInEnabled = true, bpm = 120, beatsPerBar = 4, subdivision = 1 } = opts
  const ctx = { currentTime: 0 }
  const onStopped: Array<() => void> = []
  const metronomeEngine = {
    start: vi.fn(async () => {}),
    getFirstBeatTime: vi.fn(() => 0.06),
    currentAudioTime: vi.fn(() => ctx.currentTime),
    addOnStopped: vi.fn((cb: () => void) => {
      onStopped.push(cb)
      return vi.fn()
    }),
    stop: vi.fn(),
  } as unknown as MetronomeEngine
  const bridge = {
    perfMsToAudio: (ms: number) => ms / 1000,
    audioToPerfMs: (t: number) => t * 1000,
    calibrate: vi.fn(),
  } as unknown as AudioClockBridge
  const deps: TrainingStoreDeps = {
    metronomeEngine,
    audioClockBridge: bridge,
    getSettings: () => ({ bpm, beatsPerBar, subdivision, countInEnabled }),
  }
  const store = createTrainingStore(deps)
  return { store, ctx, onStopped }
}

describe('createTrainingStore', () => {
  it('startTraining 默认进入 countIn，推进音频时间后进入 training', async () => {
    const h = createHarness() // bpm120 / 4拍 / sub1 → spSub 0.5，firstScoringTime = 0.06+4*0.5=2.06
    await h.store.getState().startTraining()
    expect(h.store.getState().phase).toBe('countIn')
    expect(h.store.getState().session?.firstScoringTime).toBeCloseTo(2.06, 9)

    h.ctx.currentTime = 2.1
    h.store.getState().expireMissedBeats()
    expect(h.store.getState().phase).toBe('training')
  })

  it('countInEnabled=false 直接进入 training', async () => {
    const h = createHarness({ countInEnabled: false })
    await h.store.getState().startTraining()
    expect(h.store.getState().phase).toBe('training')
  })

  it('count-in 阶段点击不记分', async () => {
    const h = createHarness()
    await h.store.getState().startTraining()
    h.store.getState().recordHit(1000) // 音频 1s，仍处 count-in
    expect(h.store.getState().session?.hits).toHaveLength(0)
    expect(h.store.getState().session?.resolvedCount).toBe(0)
  })

  it('recordHit 命中首拍并计分', async () => {
    const h = createHarness({ countInEnabled: false }) // firstScoringTime = 0.06
    await h.store.getState().startTraining()
    h.store.getState().recordHit(70) // 音频 0.07 → offset +10ms → perfect

    const s = h.store.getState().session!
    expect(s.hits).toHaveLength(1)
    expect(s.hits[0].judgement).toBe('perfect')
    expect(s.hits[0].offsetMs).toBeCloseTo(10, 6)
    expect(s.combo).toBe(1)
    expect(s.maxCombo).toBe(1)
    expect(s.resolvedCount).toBe(1)
    expect(s.totalScore).toBe(100)
  })

  it('同一预期拍第二次点击不计分（冗余）', async () => {
    const h = createHarness({ countInEnabled: false })
    await h.store.getState().startTraining()
    h.store.getState().recordHit(70) // beat0 perfect
    h.store.getState().recordHit(75) // 对 beat1 太早 → null

    const s = h.store.getState().session!
    expect(s.hits).toHaveLength(1)
    expect(s.resolvedCount).toBe(1)
  })

  it('expireMissedBeats 将过期拍记为 Miss', async () => {
    const h = createHarness({ countInEnabled: false })
    await h.store.getState().startTraining()
    h.ctx.currentTime = 0.3 // 首拍 0.06 + goodWindow 0.12 = 0.18 已过期
    h.store.getState().expireMissedBeats()

    const s = h.store.getState().session!
    expect(s.judgements.miss).toBeGreaterThan(0)
    expect(s.resolvedCount).toBeGreaterThan(0)
    expect(s.combo).toBe(0)
  })

  it('计时器到点（addOnStopped）→ completed', async () => {
    const h = createHarness()
    await h.store.getState().startTraining()
    h.ctx.currentTime = 2.1
    h.store.getState().expireMissedBeats() // → training
    h.onStopped[0]() // 模拟引擎计时器到点

    expect(h.store.getState().phase).toBe('summary')
    expect(h.store.getState().result?.status).toBe('completed')
  })

  it('手动 stopTraining aborted 结算', async () => {
    const h = createHarness({ countInEnabled: false })
    await h.store.getState().startTraining()
    h.store.getState().recordHit(70)
    h.ctx.currentTime = 2
    h.store.getState().stopTraining('aborted')

    const r = h.store.getState().result!
    expect(r.status).toBe('aborted')
    expect(r.hits.length).toBeGreaterThanOrEqual(1)
    expect(r.accuracy).toBeGreaterThan(0)
    expect(r.maxCombo).toBe(1)
    expect(r.subdivision).toBe(1)
  })

  it('实时匹配度用 resolvedCount，含 Miss 后 < 100', async () => {
    const h = createHarness({ countInEnabled: false })
    await h.store.getState().startTraining()
    h.store.getState().recordHit(70) // perfect
    h.ctx.currentTime = 2
    h.store.getState().expireMissedBeats() // 其后多拍 Miss

    const s = h.store.getState().session!
    expect(s.resolvedCount).toBeGreaterThan(1)
    const live = (s.totalScore / (s.resolvedCount * 100)) * 100
    expect(live).toBeLessThan(100)
  })

  it('reset 回到 idle', async () => {
    const h = createHarness()
    await h.store.getState().startTraining()
    h.store.getState().reset()
    expect(h.store.getState().phase).toBe('idle')
    expect(h.store.getState().session).toBeNull()
    expect(h.store.getState().result).toBeNull()
  })

  it('recordHit 用输入时钟桥可正常匹配命中（回归：不依赖 getOutputTimestamp）', async () => {
    const perfNow = 10_000_000
    vi.spyOn(performance, 'now').mockReturnValue(perfNow)
    const bridge = createClockBridge()
    bridge.calibrate({ currentTime: 0 }) // audioEpoch=0, perfEpoch=perfNow

    const ctx = { currentTime: 0 }
    const metronomeEngine = {
      start: vi.fn(async () => {}),
      getFirstBeatTime: vi.fn(() => 0.06),
      currentAudioTime: vi.fn(() => ctx.currentTime),
      addOnStopped: vi.fn(() => vi.fn()),
    } as unknown as MetronomeEngine

    const store = createTrainingStore({
      metronomeEngine,
      audioClockBridge: bridge,
      getSettings: () => ({
        bpm: 120,
        beatsPerBar: 4,
        subdivision: 1,
        countInEnabled: false,
      }),
    })
    await store.getState().startTraining()

    // 首拍 firstScoringTime = 0.06；其性能时间 = perfEpoch + 60ms
    store.getState().recordHit(perfNow + 60)
    const s = store.getState().session!
    expect(s.hits).toHaveLength(1)
    expect(s.hits[0].judgement).toBe('perfect')
    expect(s.resolvedCount).toBe(1)
  })
})
