export const ACCENT_FREQ = 1760
export const BEAT_FREQ = 880
export const SUB_FREQ = 1320
export const SUB_GAIN_RATIO = 0.6
export const DEFAULT_VOLUME = 0.5

const ATTACK_S = 0.002
const DECAY_S = 0.05
const DURATION_S = 0.06

export interface BeatSoundOptions {
  accent: boolean
  /** 子拍（非拍头）：频率取 SUB_FREQ 且音量按 SUB_GAIN_RATIO 缩放。 */
  soft?: boolean
}

/** 已排入音频时间线的单个节拍句柄，stop() 用于撤销尚未发声的节拍。 */
export interface ScheduledBeat {
  stop(): void
}

export interface AudioEngine {
  readonly context: AudioContext | null
  ensureContext(): AudioContext
  resume(): Promise<void>
  suspend(): Promise<void>
  scheduleBeat(audioTime: number, opts: BeatSoundOptions): ScheduledBeat
  setVolume(volume: number): void
  setMuted(muted: boolean): void
  isMuted(): boolean
  dispose(): void
}

interface AudioEngineOptions {
  createAudioContext?: () => AudioContext
}

export function createAudioEngine(opts: AudioEngineOptions = {}): AudioEngine {
  const createAudioContext = opts.createAudioContext ?? (() => new AudioContext())
  let context: AudioContext | null = null
  let masterGain: GainNode | null = null
  let volume = DEFAULT_VOLUME
  let muted = false

  function ensureContext(): AudioContext {
    if (context && context.state !== 'closed') return context
    context = createAudioContext()
    masterGain = context.createGain()
    masterGain.gain.value = volume
    masterGain.connect(context.destination)
    return context
  }

  function scheduleBeat(audioTime: number, opts: BeatSoundOptions): ScheduledBeat {
    // 静音/仅视觉：不创建任何可听节点，仍返回可撤销句柄
    if (muted) {
      return { stop() {} }
    }
    const ctx = ensureContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const freq = opts.accent ? ACCENT_FREQ : opts.soft ? SUB_FREQ : BEAT_FREQ
    const peak = opts.soft ? volume * SUB_GAIN_RATIO : volume

    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, audioTime)
    gain.gain.exponentialRampToValueAtTime(peak, audioTime + ATTACK_S)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioTime + DECAY_S)

    osc.connect(gain)
    gain.connect(masterGain!)
    osc.start(audioTime)
    osc.stop(audioTime + DURATION_S)

    return {
      stop() {
        // 未启动的节点 stop() 会抛 InvalidStateError；disconnect 把未来排定的发声从信号路径移除
        try {
          gain.disconnect()
        } catch {
          // no-op
        }
        try {
          osc.disconnect()
        } catch {
          // no-op
        }
        try {
          osc.stop()
        } catch {
          // no-op
        }
      },
    }
  }

  return {
    get context() {
      return context
    },
    ensureContext,
    async resume() {
      await context?.resume()
    },
    async suspend() {
      await context?.suspend()
    },
    scheduleBeat,
    setVolume(v) {
      volume = Math.min(1, Math.max(0, v))
      if (masterGain) masterGain.gain.value = volume
    },
    setMuted(m) {
      muted = m
    },
    isMuted() {
      return muted
    },
    dispose() {
      context?.close().catch(() => {})
      context = null
      masterGain = null
    },
  }
}
