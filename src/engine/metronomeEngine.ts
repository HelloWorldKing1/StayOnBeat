import { audioClockBridge, type AudioClockBridge } from '../lib/clock'
import {
  secondsPerBeat,
  secondsPerSubdivision,
  type SubdivisionFactor,
} from '../lib/tempo'
import type { AudioEngine, ScheduledBeat } from './audioEngine'

export const SCHEDULER_TICK_MS = 25
export const SCHEDULE_AHEAD_S = 0.12
export const START_LEAD_S = 0.06

export interface MetronomeConfig {
  bpm: number
  beatsPerBar: number
  accentFirstBeat: boolean
  /** 细分因子：1=四分，2=八分，3=三连音，4=十六分。 */
  subdivision: SubdivisionFactor
  /** 计时器秒数；null = 无限（不自动停止）。 */
  timerSeconds: number | null
}

export interface MetronomeEngine {
  start(): Promise<void>
  stop(): void
  setBpm(bpm: number): void
  setBeatsPerBar(n: number): void
  setAccentFirstBeat(on: boolean): void
  setSubdivision(sub: SubdivisionFactor): void
  setTimerSeconds(sec: number | null): void
  /** 注册计时器到点自动停止的回调；手动 stop() 不触发。 */
  setOnStopped(cb: () => void): void
  /** 追加计时器到点回调（与 setOnStopped 并存），返回退订函数。 */
  addOnStopped(cb: () => void): () => void
  isPlaying(): boolean
  /** 会话首拍音频时间（评分基准）；未播放时为 null。 */
  getFirstBeatTime(): number | null
  /** 当前音频时钟（ctx.currentTime），与调度同源，供视觉相位读取。 */
  currentAudioTime(): number
  /** 返回 audioNow 时刻正在播放的拍序号；0..beatsPerBar-1，未开始或尚未到首拍时返回 -1。 */
  beatIndexAtAudioTime(audioNow: number): number
  /** 返回 audioNow 时刻的子拍序号；0..subdivision-1，未播放或尚未到首拍时返回 -1。 */
  subdivisionIndexAtAudioTime(audioNow: number): number
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
  const config: MetronomeConfig = {
    bpm: 120,
    beatsPerBar: 4,
    accentFirstBeat: true,
    subdivision: 1,
    timerSeconds: 60,
  }
  let playing = false
  let timerId: ReturnType<typeof setInterval> | null = null
  let nextNoteTime = 0
  let beatIndex = 0
  let subIndex = 0
  let firstBeatTime: number | null = null
  let endAudioTime: number | null = null
  const stoppedCallbacks = new Set<() => void>()
  const pending = new Set<ScheduledBeat>()

  function flushPending() {
    for (const beat of pending) beat.stop()
    pending.clear()
  }

  /** 播放中改速/改拍号/改细分/改计时器：撤销已排节拍，从第 1 拍重新排。 */
  function restartRound() {
    flushPending()
    beatIndex = 0
    subIndex = 0
    const ctx = audioEngine.context
    if (!ctx) return
    firstBeatTime = ctx.currentTime + START_LEAD_S
    nextNoteTime = firstBeatTime
    endAudioTime =
      config.timerSeconds == null ? null : ctx.currentTime + config.timerSeconds
  }

  /** 计时器到点自动停止：只清 interval + 置态 + 回调；不 flush、不 suspend，让窗口内已排节拍自然播完。 */
  function stopForTimer() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    playing = false
    beatIndex = 0
    subIndex = 0
    firstBeatTime = null
    endAudioTime = null
    for (const cb of stoppedCallbacks) cb()
  }

  function tick() {
    const ctx = audioEngine.context
    if (!ctx || ctx.state !== 'running') return
    if (endAudioTime != null && ctx.currentTime >= endAudioTime) {
      stopForTimer()
      return
    }
    const upperBound =
      endAudioTime == null
        ? ctx.currentTime + SCHEDULE_AHEAD_S
        : Math.min(ctx.currentTime + SCHEDULE_AHEAD_S, endAudioTime)
    while (nextNoteTime < upperBound) {
      const isBeatOnset = subIndex === 0
      const accent = config.accentFirstBeat && beatIndex === 0 && isBeatOnset
      const soft = !isBeatOnset
      const handle = audioEngine.scheduleBeat(nextNoteTime, { accent, soft })
      pending.add(handle)
      subIndex = (subIndex + 1) % config.subdivision
      if (subIndex === 0) beatIndex = (beatIndex + 1) % config.beatsPerBar
      nextNoteTime += secondsPerSubdivision(config.bpm, config.subdivision)
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
    subIndex = 0
    firstBeatTime = null
    endAudioTime = null
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
      subIndex = 0
      firstBeatTime = ctx.currentTime + START_LEAD_S
      nextNoteTime = firstBeatTime
      endAudioTime =
        config.timerSeconds == null ? null : ctx.currentTime + config.timerSeconds
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
    setSubdivision(sub) {
      config.subdivision = sub
      if (playing) restartRound()
    },
    setTimerSeconds(sec) {
      config.timerSeconds = sec
      if (playing) restartRound()
    },
    setOnStopped(cb) {
      stoppedCallbacks.clear()
      stoppedCallbacks.add(cb)
    },
    addOnStopped(cb) {
      stoppedCallbacks.add(cb)
      return () => {
        stoppedCallbacks.delete(cb)
      }
    },
    isPlaying() {
      return playing
    },
    getFirstBeatTime() {
      return firstBeatTime
    },
    currentAudioTime() {
      return audioEngine.context?.currentTime ?? 0
    },
    beatIndexAtAudioTime(audioNow) {
      if (!playing || firstBeatTime == null) return -1
      if (audioNow < firstBeatTime) return -1
      const elapsed = audioNow - firstBeatTime
      const idx = Math.floor(elapsed / secondsPerBeat(config.bpm))
      return idx % config.beatsPerBar
    },
    subdivisionIndexAtAudioTime(audioNow) {
      if (!playing || firstBeatTime == null) return -1
      if (audioNow < firstBeatTime) return -1
      const elapsed = audioNow - firstBeatTime
      const idx = Math.floor(
        elapsed / secondsPerSubdivision(config.bpm, config.subdivision),
      )
      return idx % config.subdivision
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
