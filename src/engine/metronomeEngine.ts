import { audioClockBridge, type AudioClockBridge } from '../lib/clock'
import { secondsPerBeat } from '../lib/tempo'
import type { AudioEngine, ScheduledBeat } from './audioEngine'

export const SCHEDULER_TICK_MS = 25
export const SCHEDULE_AHEAD_S = 0.12
export const START_LEAD_S = 0.06

export interface MetronomeConfig {
  bpm: number
  beatsPerBar: number
  accentFirstBeat: boolean
}

export interface MetronomeEngine {
  start(): Promise<void>
  stop(): void
  setBpm(bpm: number): void
  setBeatsPerBar(n: number): void
  setAccentFirstBeat(on: boolean): void
  isPlaying(): boolean
  /** 返回 audioNow 时刻正在播放的拍序号；0..beatsPerBar-1，未开始或尚未到首拍时返回 -1。 */
  beatIndexAtAudioTime(audioNow: number): number
  getConfig(): MetronomeConfig
  /** 后台标签页节流可能导致调度窗口耗尽；回前台时调用以重校准时钟桥并从第 1 拍重排。 */
  resumeAfterBackground(): void
  dispose(): void
}

interface MetronomeEngineDeps {
  audioEngine: AudioEngine
  audioClockBridge?: AudioClockBridge
}

export function createMetronomeEngine({
  audioEngine,
  audioClockBridge: bridge = audioClockBridge,
}: MetronomeEngineDeps): MetronomeEngine {
  const config: MetronomeConfig = { bpm: 120, beatsPerBar: 4, accentFirstBeat: true }
  let playing = false
  let timerId: ReturnType<typeof setInterval> | null = null
  let nextNoteTime = 0
  let beatIndex = 0
  let firstBeatTime: number | null = null
  const pending = new Set<ScheduledBeat>()

  function flushPending() {
    for (const beat of pending) beat.stop()
    pending.clear()
  }

  /** 播放中改速/改拍号：撤销已排节拍，从第 1 拍重新排。 */
  function restartRound() {
    flushPending()
    beatIndex = 0
    const ctx = audioEngine.context
    if (!ctx) return
    firstBeatTime = ctx.currentTime + START_LEAD_S
    nextNoteTime = firstBeatTime
  }

  function tick() {
    const ctx = audioEngine.context
    if (!ctx || ctx.state !== 'running') return
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const accent = config.accentFirstBeat && beatIndex === 0
      const handle = audioEngine.scheduleBeat(nextNoteTime, { accent })
      pending.add(handle)
      beatIndex = (beatIndex + 1) % config.beatsPerBar
      nextNoteTime += secondsPerBeat(config.bpm)
    }
  }

  function stop() {
    if (!playing) return
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    flushPending()
    playing = false
    beatIndex = 0
    firstBeatTime = null
    void audioEngine.suspend()
  }

  return {
    async start() {
      if (playing) return
      // ensureContext 必须同步执行，保持在用户手势调用栈内
      const ctx = audioEngine.ensureContext()
      await audioEngine.resume()
      bridge.calibrate(ctx)
      playing = true
      beatIndex = 0
      firstBeatTime = ctx.currentTime + START_LEAD_S
      nextNoteTime = firstBeatTime
      timerId = setInterval(tick, SCHEDULER_TICK_MS)
      tick()
    },
    stop,
    setBpm(bpm) {
      config.bpm = bpm
      if (playing) restartRound()
    },
    setBeatsPerBar(n) {
      config.beatsPerBar = n
      if (playing) restartRound()
    },
    setAccentFirstBeat(on) {
      config.accentFirstBeat = on
    },
    isPlaying() {
      return playing
    },
    beatIndexAtAudioTime(audioNow) {
      if (!playing || firstBeatTime == null) return -1
      if (audioNow < firstBeatTime) return -1
      const elapsed = audioNow - firstBeatTime
      const idx = Math.floor(elapsed / secondsPerBeat(config.bpm))
      return idx % config.beatsPerBar
    },
    getConfig() {
      return { ...config }
    },
    resumeAfterBackground() {
      if (!playing) return
      const ctx = audioEngine.context
      if (!ctx) return
      bridge.calibrate(ctx)
      restartRound()
    },
    dispose() {
      stop()
    },
  }
}
