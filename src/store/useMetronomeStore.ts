import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { clampBeatsPerBar, clampBpm, type SubdivisionFactor } from '../lib/tempo'
import { createAudioEngine, type AudioEngine } from '../engine/audioEngine'
import { createMetronomeEngine, type MetronomeEngine } from '../engine/metronomeEngine'

export type Theme = 'dark' | 'light'

export interface MetronomeState {
  bpm: number
  beatsPerBar: number
  accentFirstBeat: boolean
  subdivision: SubdivisionFactor
  /** 计时器秒数；null = 无限（不自动停止）。 */
  timerSeconds: number | null
  muted: boolean
  volume: number
  theme: Theme
  isPlaying: boolean
  /** 当前正在播放的拍序号；0..beatsPerBar-1，未播放或尚未到首拍时为 -1。 */
  currentBeat: number
  /** 当前子拍序号；0..subdivision-1，未播放时为 -1。 */
  currentSubdivision: number
  start(): Promise<void>
  stop(): void
  setBpm(bpm: number): void
  setBeatsPerBar(n: number): void
  setAccentFirstBeat(on: boolean): void
  setSubdivision(sub: SubdivisionFactor): void
  setTimerSeconds(sec: number | null): void
  setMuted(muted: boolean): void
  setVolume(volume: number): void
  setTheme(theme: Theme): void
  /** 仅供 useBeatPulse 写入，UI 不应直接调用。 */
  _setCurrentBeat(beat: number): void
  /** 仅供 useBeatPulse 写入，UI 不应直接调用。 */
  _setCurrentSubdivision(sub: number): void
}

/** 持久化的设置子集（不含运行时瞬态）。 */
export type MetronomeSettingsData = Pick<
  MetronomeState,
  | 'bpm'
  | 'beatsPerBar'
  | 'accentFirstBeat'
  | 'subdivision'
  | 'timerSeconds'
  | 'muted'
  | 'volume'
  | 'theme'
>

export type MetronomeStoreData = MetronomeSettingsData &
  Pick<MetronomeState, 'isPlaying' | 'currentBeat' | 'currentSubdivision'>

export const SETTINGS_STORAGE_KEY = 'stayonbeat-settings'

export const INITIAL_STATE: MetronomeStoreData = {
  bpm: 120,
  beatsPerBar: 4,
  accentFirstBeat: true,
  subdivision: 1,
  timerSeconds: 60,
  muted: true,
  volume: 0.5,
  theme: 'dark',
  isPlaying: false,
  currentBeat: -1,
  currentSubdivision: -1,
}

export interface MetronomeStoreDeps {
  audioEngine?: AudioEngine
  metronomeEngine?: MetronomeEngine
}

export interface MetronomeStoreOpts {
  /** 是否启用 localStorage 持久化；仅应用单例开启，测试默认关闭。 */
  persist?: boolean
  /** 注入内存 storage 用于持久化单测。 */
  storage?: StateStorage
}

export function createMetronomeStore(
  deps: MetronomeStoreDeps = {},
  opts: MetronomeStoreOpts = {},
): UseBoundStore<StoreApi<MetronomeState>> {
  const audioEngine = deps.audioEngine ?? createAudioEngine()
  const metronomeEngine = deps.metronomeEngine ?? createMetronomeEngine({ audioEngine })

  const creator: StateCreator<MetronomeState> = (set, get) => ({
    ...INITIAL_STATE,
    async start() {
      if (get().isPlaying) return
      try {
        await metronomeEngine.start()
        set({ isPlaying: true, currentBeat: -1, currentSubdivision: -1 })
      } catch (err) {
        // 浏览器可能拒绝 resume（autoplay 策略），仅记录，不进入播放态
        console.error('节拍器启动失败', err)
      }
    },
    stop() {
      metronomeEngine.stop()
      set({ isPlaying: false, currentBeat: -1, currentSubdivision: -1 })
    },
    setBpm(bpm) {
      const clamped = clampBpm(bpm)
      metronomeEngine.setBpm(clamped)
      set({
        bpm: clamped,
        currentBeat: get().isPlaying ? -1 : get().currentBeat,
        currentSubdivision: get().isPlaying ? -1 : get().currentSubdivision,
      })
    },
    setBeatsPerBar(n) {
      const clamped = clampBeatsPerBar(n)
      metronomeEngine.setBeatsPerBar(clamped)
      set({
        beatsPerBar: clamped,
        currentBeat: get().isPlaying ? -1 : get().currentBeat,
        currentSubdivision: get().isPlaying ? -1 : get().currentSubdivision,
      })
    },
    setAccentFirstBeat(on) {
      metronomeEngine.setAccentFirstBeat(on)
      set({ accentFirstBeat: on })
    },
    setSubdivision(sub) {
      metronomeEngine.setSubdivision(sub)
      set({
        subdivision: sub,
        currentBeat: get().isPlaying ? -1 : get().currentBeat,
        currentSubdivision: get().isPlaying ? -1 : get().currentSubdivision,
      })
    },
    setTimerSeconds(sec) {
      metronomeEngine.setTimerSeconds(sec)
      set({
        timerSeconds: sec,
        currentBeat: get().isPlaying ? -1 : get().currentBeat,
        currentSubdivision: get().isPlaying ? -1 : get().currentSubdivision,
      })
    },
    setMuted(muted) {
      audioEngine.setMuted(muted)
      set({ muted })
    },
    setVolume(volume) {
      const clamped = Math.min(1, Math.max(0, volume))
      audioEngine.setVolume(clamped)
      set({ volume: clamped })
    },
    setTheme(theme) {
      document.documentElement.dataset.theme = theme
      set({ theme })
    },
    _setCurrentBeat(beat) {
      set({ currentBeat: beat })
    },
    _setCurrentSubdivision(sub) {
      set({ currentSubdivision: sub })
    },
  })

  const store: UseBoundStore<StoreApi<MetronomeState>> = opts.persist
    ? (create<MetronomeState>()(
        persist(creator, {
          name: SETTINGS_STORAGE_KEY,
          version: 1,
          partialize: (state): MetronomeSettingsData => ({
            bpm: state.bpm,
            beatsPerBar: state.beatsPerBar,
            accentFirstBeat: state.accentFirstBeat,
            subdivision: state.subdivision,
            timerSeconds: state.timerSeconds,
            muted: state.muted,
            volume: state.volume,
            theme: state.theme,
          }),
          storage: opts.storage
            ? createJSONStorage(() => opts.storage!)
            : createJSONStorage(() => localStorage),
          onRehydrateStorage: () => (state) => {
            if (state?.theme) document.documentElement.dataset.theme = state.theme
          },
        }),
      ) as unknown as UseBoundStore<StoreApi<MetronomeState>>)
    : create<MetronomeState>()(creator)

  // 计时器到点自动停止 → 同步运行态（手动 stop 不触发）
  metronomeEngine.setOnStopped(() =>
    store.setState({ isPlaying: false, currentBeat: -1, currentSubdivision: -1 }),
  )

  return store
}

// 应用单例：引擎在模块顶层创建并导出，供 useBeatPulse 等复用（AudioContext 惰性，导入无副作用）
export const audioEngine = createAudioEngine()
export const metronomeEngine = createMetronomeEngine({ audioEngine })
export const useMetronomeStore = createMetronomeStore(
  { audioEngine, metronomeEngine },
  { persist: true },
)

/** 组件测试复位状态用。 */
export function resetMetronomeStore(store = useMetronomeStore): void {
  store.setState(INITIAL_STATE)
}
