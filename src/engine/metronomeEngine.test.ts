import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { secondsPerBeat } from '../lib/tempo'
import type { AudioClockBridge } from '../lib/clock'
import type { AudioEngine } from './audioEngine'
import { createMetronomeEngine } from './metronomeEngine'

interface FakeCtx {
  currentTime: number
  state: 'running' | 'suspended'
}

interface Harness {
  audioEngine: AudioEngine
  bridge: AudioClockBridge
  ctx: FakeCtx
  scheduled: Array<{ time: number; accent: boolean; soft?: boolean }>
  stoppedBeats: Array<{ stop: ReturnType<typeof vi.fn> }>
}

function createHarness(): Harness {
  const ctx: FakeCtx = { currentTime: 0, state: 'running' }
  const scheduled: Array<{ time: number; accent: boolean; soft?: boolean }> = []
  const stoppedBeats: Array<{ stop: ReturnType<typeof vi.fn> }> = []
  const audioEngine = {
    context: ctx,
    ensureContext: vi.fn(() => ctx),
    resume: vi.fn(async () => {
      ctx.state = 'running'
    }),
    suspend: vi.fn(async () => {
      ctx.state = 'suspended'
    }),
    scheduleBeat: vi.fn((time: number, opts: { accent: boolean; soft?: boolean }) => {
      const handle = { stop: vi.fn() }
      scheduled.push({ time, accent: opts.accent, soft: opts.soft })
      stoppedBeats.push(handle)
      return handle
    }),
    setVolume: vi.fn(),
    dispose: vi.fn(),
  }
  const bridge: AudioClockBridge = {
    calibrate: vi.fn(),
    audioToPerfMs: vi.fn(),
    perfMsToAudio: vi.fn(),
  }
  return {
    audioEngine: audioEngine as unknown as AudioEngine,
    bridge,
    ctx,
    scheduled,
    stoppedBeats,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createMetronomeEngine', () => {
  it('start 后按 lookahead 窗口预排，间距稳定且仅首拍为重音', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()

    expect(h.audioEngine.ensureContext).toHaveBeenCalled()
    expect(h.audioEngine.resume).toHaveBeenCalled()
    expect(h.bridge.calibrate).toHaveBeenCalled()

    for (let i = 0; i < 60; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }

    const times = h.scheduled.map((s) => s.time).sort((a, b) => a - b)
    expect(times.length).toBeGreaterThanOrEqual(3)
    for (const t of times) expect(t).toBeLessThan(h.ctx.currentTime + 0.12)
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeCloseTo(secondsPerBeat(120), 9)
    }
    const accents = h.scheduled.filter((s) => s.accent)
    expect(accents).toHaveLength(1)
    expect(accents[0].time).toBeCloseTo(0.06, 9)
  })

  it('stop 清空调度并撤销全部已排节拍', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    expect(engine.isPlaying()).toBe(true)

    engine.stop()
    expect(engine.isPlaying()).toBe(false)
    for (const handle of h.stoppedBeats) {
      expect(handle.stop).toHaveBeenCalled()
    }
    expect(h.audioEngine.suspend).toHaveBeenCalled()

    const countAfterStop = h.scheduled.length
    h.ctx.currentTime += 0.5
    vi.advanceTimersByTime(500)
    expect(h.scheduled.length).toBe(countAfterStop)
  })

  it('重复 start 不会重复启动', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    await engine.start()
    expect(h.audioEngine.ensureContext).toHaveBeenCalledTimes(1)
  })

  it('播放中 setBpm 会 flush 已排节拍并从第 1 拍重排', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    for (let i = 0; i < 60; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }
    const scheduledBefore = h.scheduled.length
    expect(scheduledBefore).toBeGreaterThan(1)

    // 已排节拍此刻应全部被停止（flushPending）
    for (const handle of h.stoppedBeats) {
      expect(handle.stop).toHaveBeenCalledTimes(0)
    }

    const ctxBefore = h.ctx.currentTime
    engine.setBpm(240)
    expect(engine.getConfig().bpm).toBe(240)

    // flush：旧的已排节拍全部被 stop
    for (const handle of h.stoppedBeats) {
      expect(handle.stop.mock.calls.length).toBeGreaterThan(0)
    }

    // 下一 tick 从新 firstBeatTime = ctxBefore + 0.06 排起
    h.ctx.currentTime += 0.025
    vi.advanceTimersByTime(25)
    const newBeat = h.scheduled[h.scheduled.length - 1]
    expect(newBeat.time).toBeCloseTo(ctxBefore + 0.06, 9)

    // beatIndexAtAudioTime：首拍前 -1，之后从 0 循环（间隔 0.25）
    expect(engine.beatIndexAtAudioTime(ctxBefore)).toBe(-1)
    expect(engine.beatIndexAtAudioTime(ctxBefore + 0.06)).toBe(0)
    expect(engine.beatIndexAtAudioTime(ctxBefore + 0.06 + 0.25)).toBe(1)
  })

  it('beatIndexAtAudioTime 按拍号取模循环', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    engine.setBeatsPerBar(3)
    await engine.start()

    expect(engine.beatIndexAtAudioTime(0.05)).toBe(-1)
    expect(engine.beatIndexAtAudioTime(0.06)).toBe(0)
    expect(engine.beatIndexAtAudioTime(0.06 + 0.5)).toBe(1)
    expect(engine.beatIndexAtAudioTime(0.06 + 0.5 * 2)).toBe(2)
    expect(engine.beatIndexAtAudioTime(0.06 + 0.5 * 3)).toBe(0)
    expect(engine.beatIndexAtAudioTime(0.06 + 0.5 * 4)).toBe(1)
  })

  it('关闭重音后不再产生 accent 节拍', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    engine.setAccentFirstBeat(false)
    await engine.start()
    for (let i = 0; i < 60; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }
    expect(h.scheduled.filter((s) => s.accent)).toHaveLength(0)
  })

  it('resumeAfterBackground 重校准时钟桥并从第 1 拍重排', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    for (let i = 0; i < 60; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }
    expect(h.scheduled.length).toBeGreaterThan(1)

    // 后台一段时间：currentTime 大幅前进，调度窗口早已耗尽
    h.ctx.currentTime += 5
    const ctxNow = h.ctx.currentTime
    engine.resumeAfterBackground()

    // 桥被重校准（start 1 次 + 本次 1 次）
    expect(h.bridge.calibrate).toHaveBeenCalledTimes(2)
    // 旧的已排节拍全部被 stop
    for (const handle of h.stoppedBeats) {
      expect(handle.stop.mock.calls.length).toBeGreaterThan(0)
    }
    // 下一 tick 从 ctxNow + 0.06 重排，且当前时刻无拍
    h.ctx.currentTime += 0.025
    vi.advanceTimersByTime(25)
    const newBeat = h.scheduled[h.scheduled.length - 1]
    expect(newBeat.time).toBeCloseTo(ctxNow + 0.06, 9)
    expect(engine.beatIndexAtAudioTime(ctxNow)).toBe(-1)
    expect(engine.beatIndexAtAudioTime(ctxNow + 0.06)).toBe(0)
  })

  it('currentAudioTime 返回调度同源的 ctx.currentTime', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    h.ctx.currentTime = 12.5
    expect(engine.currentAudioTime()).toBe(12.5)
  })

  it('context 为 null 时 currentAudioTime 返回 0', () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: { context: null } as unknown as AudioEngine,
      audioClockBridge: h.bridge,
    })
    expect(engine.currentAudioTime()).toBe(0)
  })

  it('subdivision=2 时按子拍间隔排拍，重音仅小节首拍，soft 标记子拍', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    engine.setSubdivision(2)
    await engine.start()

    for (let i = 0; i < 60; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }

    const times = h.scheduled.map((s) => s.time).sort((a, b) => a - b)
    expect(times.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeCloseTo(0.25, 9)
    }

    const accents = h.scheduled.filter((s) => s.accent)
    expect(accents).toHaveLength(1)
    expect(accents[0].time).toBeCloseTo(0.06, 9)
    expect(accents[0].soft).toBe(false)

    // 拍头（0.56 = beat1 拍头）soft=false；子拍（0.31）soft=true
    const head = h.scheduled.find((s) => Math.abs(s.time - 0.56) < 1e-6)
    expect(head?.soft).toBe(false)
    const sub = h.scheduled.find((s) => Math.abs(s.time - 0.31) < 1e-6)
    expect(sub?.soft).toBe(true)
  })

  it('beatIndexAtAudioTime 在细分下仍按拍返回', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    engine.setSubdivision(2)
    await engine.start()

    expect(engine.beatIndexAtAudioTime(0.06)).toBe(0)
    expect(engine.beatIndexAtAudioTime(0.56)).toBe(1)
    expect(engine.beatIndexAtAudioTime(1.06)).toBe(2)
    expect(engine.beatIndexAtAudioTime(1.56)).toBe(3)
  })

  it('subdivisionIndexAtAudioTime 在子拍内循环', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    engine.setSubdivision(2)
    await engine.start()

    expect(engine.subdivisionIndexAtAudioTime(0.05)).toBe(-1)
    expect(engine.subdivisionIndexAtAudioTime(0.06)).toBe(0)
    expect(engine.subdivisionIndexAtAudioTime(0.31)).toBe(1)
    expect(engine.subdivisionIndexAtAudioTime(0.56)).toBe(0)
    expect(engine.subdivisionIndexAtAudioTime(0.81)).toBe(1)
  })

  it('播放中 setSubdivision 会 flush 并从第 1 拍重排', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    for (let i = 0; i < 60; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }

    const ctxBefore = h.ctx.currentTime
    engine.setSubdivision(2)
    expect(engine.getConfig().subdivision).toBe(2)

    // flush：旧句柄全部 stop
    for (const handle of h.stoppedBeats) {
      expect(handle.stop.mock.calls.length).toBeGreaterThan(0)
    }

    // 下一 tick 从 ctxBefore + 0.06 以子拍间距重排
    h.ctx.currentTime += 0.025
    vi.advanceTimersByTime(25)
    const newBeat = h.scheduled[h.scheduled.length - 1]
    expect(newBeat.time).toBeCloseTo(ctxBefore + 0.06, 9)
  })

  it('计时器到点自动停止且不 flush、不 suspend', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    const onStopped = vi.fn()
    engine.setOnStopped(onStopped)
    engine.setTimerSeconds(1)
    await engine.start()

    expect(engine.isPlaying()).toBe(true)
    for (let i = 0; i < 50; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }

    expect(engine.isPlaying()).toBe(false)
    expect(onStopped).toHaveBeenCalledTimes(1)
    expect(h.audioEngine.suspend).not.toHaveBeenCalled()
    // 窗口内已排节拍未被 stop（timer 停止不 flush）
    for (const handle of h.stoppedBeats) {
      expect(handle.stop.mock.calls.length).toBe(0)
    }
    // 到点后不再排拍
    const countAfter = h.scheduled.length
    h.ctx.currentTime += 1
    vi.advanceTimersByTime(1000)
    expect(h.scheduled.length).toBe(countAfter)
  })

  it('timerSeconds=null 时持续播放不自动停止', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    const onStopped = vi.fn()
    engine.setOnStopped(onStopped)
    engine.setTimerSeconds(null)
    await engine.start()

    for (let i = 0; i < 50; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }
    expect(engine.isPlaying()).toBe(true)
    expect(onStopped).not.toHaveBeenCalled()
    expect(h.scheduled.length).toBeGreaterThan(0)
  })

  it('播放中 setTimerSeconds 触发 restartRound', async () => {
    const h = createHarness()
    const engine = createMetronomeEngine({
      audioEngine: h.audioEngine,
      audioClockBridge: h.bridge,
    })
    await engine.start()
    for (let i = 0; i < 20; i++) {
      h.ctx.currentTime += 0.025
      vi.advanceTimersByTime(25)
    }

    const ctxBefore = h.ctx.currentTime
    engine.setTimerSeconds(2)
    expect(engine.getConfig().timerSeconds).toBe(2)
    // flush 旧句柄
    for (const handle of h.stoppedBeats) {
      expect(handle.stop.mock.calls.length).toBeGreaterThan(0)
    }

    h.ctx.currentTime += 0.025
    vi.advanceTimersByTime(25)
    const newBeat = h.scheduled[h.scheduled.length - 1]
    expect(newBeat.time).toBeCloseTo(ctxBefore + 0.06, 9)
  })
})
