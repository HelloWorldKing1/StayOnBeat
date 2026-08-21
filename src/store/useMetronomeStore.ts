import { create } from 'zustand'
import { clampBeatsPerBar, clampBpm } from '../lib/tempo'
import { createAudioEngine, type AudioEngine } from '../engine/audioEngine'
import { createMetronomeEngine, type MetronomeEngine } from '../engine/metronomeEngine'

export interface MetronomeState {
  bpm: number
  beatsPerBar: number
  accentFirstBeat: boolean
  isPlaying: boolean
  /** 当前正在播放的拍序号；0..beatsPerBar-1，未播放或尚未到首拍时为 -1。 */
  currentBeat: number
  start(): Promise<void>
  stop(): void
  setBpm(bpm: number): void
  setBeatsPerBar(n: number): void
  setAccentFirstBeat(on: boolean): void
  /** 仅供 useBeatPulse 写入，UI 不应直接调用。 */
  _setCurrentBeat(beat: number): void
}

export type MetronomeStoreData = Pick<
  MetronomeState,
  'bpm' | 'beatsPerBar' | 'accentFirstBeat' | 'isPlaying' | 'currentBeat'
>

export const INITIAL_STATE: MetronomeStoreData = {
  bpm: 120,
  beatsPerBar: 4,
  accentFirstBeat: true,
  isPlaying: false,
  currentBeat: -1,
}

export interface MetronomeStoreDeps {
  audioEngine?: AudioEngine
  metronomeEngine?: MetronomeEngine
}

/** 测试可注入假引擎；应用侧使用下方单例。 */
export function createMetronomeStore(deps: MetronomeStoreDeps = {}) {
  const audioEngine = deps.audioEngine ?? createAudioEngine()
  const metronomeEngine = deps.metronomeEngine ?? createMetronomeEngine({ audioEngine })

  return create<MetronomeState>()((set, get) => ({
    ...INITIAL_STATE,
    async start() {
      if (get().isPlaying) return
      try {
        await metronomeEngine.start()
        set({ isPlaying: true, currentBeat: -1 })
      } catch (err) {
        // 浏览器可能拒绝 resume（autoplay 策略），仅记录，不进入播放态
        console.error('节拍器启动失败', err)
      }
    },
    stop() {
      metronomeEngine.stop()
      set({ isPlaying: false, currentBeat: -1 })
    },
    setBpm(bpm) {
      const clamped = clampBpm(bpm)
      metronomeEngine.setBpm(clamped)
      set({ bpm: clamped, currentBeat: get().isPlaying ? -1 : get().currentBeat })
    },
    setBeatsPerBar(n) {
      const clamped = clampBeatsPerBar(n)
      metronomeEngine.setBeatsPerBar(clamped)
      set({
        beatsPerBar: clamped,
        currentBeat: get().isPlaying ? -1 : get().currentBeat,
      })
    },
    setAccentFirstBeat(on) {
      metronomeEngine.setAccentFirstBeat(on)
      set({ accentFirstBeat: on })
    },
    _setCurrentBeat(beat) {
      set({ currentBeat: beat })
    },
  }))
}

// 应用单例：引擎在模块顶层创建并导出，供 useBeatPulse 等复用（AudioContext 惰性，导入无副作用）
export const audioEngine = createAudioEngine()
export const metronomeEngine = createMetronomeEngine({ audioEngine })
export const useMetronomeStore = createMetronomeStore({ audioEngine, metronomeEngine })

/** 组件测试复位状态用。 */
export function resetMetronomeStore(store = useMetronomeStore): void {
  store.setState(INITIAL_STATE)
}
