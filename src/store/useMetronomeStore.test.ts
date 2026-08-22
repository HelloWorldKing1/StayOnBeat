import { describe, expect, it, vi } from 'vitest'
import type { StateStorage } from 'zustand/middleware'
import {
  INITIAL_STATE,
  SETTINGS_STORAGE_KEY,
  createMetronomeStore,
  type MetronomeStoreDeps,
} from './useMetronomeStore'

function fakeDeps(): MetronomeStoreDeps {
  const audioEngine = {
    context: null,
    ensureContext: vi.fn(() => ({ currentTime: 0, state: 'running' })),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    scheduleBeat: vi.fn(() => ({ stop: vi.fn() })),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    isMuted: vi.fn(() => false),
    dispose: vi.fn(),
  }
  const metronomeEngine = {
    start: vi.fn(async () => {}),
    stop: vi.fn(),
    setBpm: vi.fn(),
    setBeatsPerBar: vi.fn(),
    setAccentFirstBeat: vi.fn(),
    setSubdivision: vi.fn(),
    setTimerSeconds: vi.fn(),
    setOnStopped: vi.fn(),
    isPlaying: vi.fn(() => false),
    currentAudioTime: vi.fn(() => 0),
    beatIndexAtAudioTime: vi.fn(() => -1),
    subdivisionIndexAtAudioTime: vi.fn(() => -1),
    getConfig: vi.fn(() => ({
      bpm: 120,
      beatsPerBar: 4,
      accentFirstBeat: true,
      subdivision: 1,
      timerSeconds: 60,
    })),
    resumeAfterBackground: vi.fn(),
    dispose: vi.fn(),
  }
  return { audioEngine, metronomeEngine } as unknown as MetronomeStoreDeps
}

function createMemoryStorage(): StateStorage {
  const map = new Map<string, string>()
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value)
    },
    removeItem: (name) => {
      map.delete(name)
    },
  }
}

describe('createMetronomeStore', () => {
  it('初始状态与 INITIAL_STATE 一致', () => {
    const store = createMetronomeStore(fakeDeps())
    const state = store.getState()
    expect({
      bpm: state.bpm,
      beatsPerBar: state.beatsPerBar,
      accentFirstBeat: state.accentFirstBeat,
      subdivision: state.subdivision,
      timerSeconds: state.timerSeconds,
      muted: state.muted,
      volume: state.volume,
      theme: state.theme,
      mode: state.mode,
      countInEnabled: state.countInEnabled,
      inputMode: state.inputMode,
      calibrationMs: state.calibrationMs,
      isPlaying: state.isPlaying,
      currentBeat: state.currentBeat,
      currentSubdivision: state.currentSubdivision,
    }).toEqual(INITIAL_STATE)
  })

  it('start 委托引擎并进入播放态', async () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    await store.getState().start()
    expect(fakes.metronomeEngine!.start).toHaveBeenCalled()
    expect(store.getState().isPlaying).toBe(true)
    expect(store.getState().currentBeat).toBe(-1)
    expect(store.getState().currentSubdivision).toBe(-1)
  })

  it('start 失败时仅记录日志，不进入播放态', async () => {
    const fakes = fakeDeps()
    fakes.metronomeEngine!.start = vi.fn(async () => {
      throw new Error('NotAllowedError')
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = createMetronomeStore(fakes)
    await store.getState().start()
    expect(store.getState().isPlaying).toBe(false)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('stop 委托引擎并退出播放态', async () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.setState({ isPlaying: true, currentBeat: 1, currentSubdivision: 0 })
    store.getState().stop()
    expect(fakes.metronomeEngine!.stop).toHaveBeenCalled()
    expect(store.getState().isPlaying).toBe(false)
    expect(store.getState().currentBeat).toBe(-1)
  })

  it('setBpm 夹取并委托引擎，播放中重置运行态', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setBpm(999)
    expect(store.getState().bpm).toBe(240)
    expect(fakes.metronomeEngine!.setBpm).toHaveBeenCalledWith(240)

    store.setState({ isPlaying: true, currentBeat: 2, currentSubdivision: 1 })
    store.getState().setBpm(90)
    expect(store.getState().currentBeat).toBe(-1)
    expect(store.getState().currentSubdivision).toBe(-1)
  })

  it('setBeatsPerBar 夹取并委托引擎', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setBeatsPerBar(0)
    expect(store.getState().beatsPerBar).toBe(1)
    expect(fakes.metronomeEngine!.setBeatsPerBar).toHaveBeenCalledWith(1)
  })

  it('setSubdivision / setTimerSeconds 委托引擎', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setSubdivision(2)
    expect(fakes.metronomeEngine!.setSubdivision).toHaveBeenCalledWith(2)
    expect(store.getState().subdivision).toBe(2)

    store.getState().setTimerSeconds(null)
    expect(fakes.metronomeEngine!.setTimerSeconds).toHaveBeenCalledWith(null)
    expect(store.getState().timerSeconds).toBeNull()
  })

  it('setMuted / setVolume 委托 audioEngine 并夹取音量', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setMuted(false)
    expect(fakes.audioEngine!.setMuted).toHaveBeenCalledWith(false)
    expect(store.getState().muted).toBe(false)

    store.getState().setVolume(2)
    expect(store.getState().volume).toBe(1)
    expect(fakes.audioEngine!.setVolume).toHaveBeenCalledWith(1)

    store.getState().setVolume(-1)
    expect(store.getState().volume).toBe(0)
  })

  it('setTheme 同步 DOM data-theme 与状态', () => {
    const store = createMetronomeStore(fakeDeps())
    store.getState().setTheme('light')
    expect(store.getState().theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('setMode / setCountInEnabled 更新设置', () => {
    const store = createMetronomeStore(fakeDeps())
    store.getState().setMode('metronome')
    expect(store.getState().mode).toBe('metronome')
    store.getState().setCountInEnabled(false)
    expect(store.getState().countInEnabled).toBe(false)
  })

  it('setInputMode / setCalibrationMs 更新设置', () => {
    const store = createMetronomeStore(fakeDeps())
    store.getState().setInputMode('mixed')
    expect(store.getState().inputMode).toBe('mixed')
    store.getState().setCalibrationMs(150)
    expect(store.getState().calibrationMs).toBe(150)
    store.getState().setCalibrationMs(9999)
    expect(store.getState().calibrationMs).toBe(500)
  })

  it('_setCurrentBeat / _setCurrentSubdivision 更新运行态', () => {
    const store = createMetronomeStore(fakeDeps())
    store.getState()._setCurrentBeat(3)
    store.getState()._setCurrentSubdivision(1)
    expect(store.getState().currentBeat).toBe(3)
    expect(store.getState().currentSubdivision).toBe(1)
  })

  it('persist 只写设置子集并能 hydrate 恢复', () => {
    const storage = createMemoryStorage()
    const store = createMetronomeStore(fakeDeps(), { persist: true, storage })

    store.getState().setBpm(90)
    store.getState().setTheme('light')
    store.getState().setSubdivision(2)
    store.getState().setMode('metronome')
    store.getState().setCountInEnabled(false)
    store.getState().setInputMode('mouse')

    const raw = storage.getItem(SETTINGS_STORAGE_KEY) as string | null
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> }
    expect(parsed.state.bpm).toBe(90)
    expect(parsed.state.theme).toBe('light')
    expect(parsed.state.subdivision).toBe(2)
    expect(parsed.state.mode).toBe('metronome')
    expect(parsed.state.countInEnabled).toBe(false)
    expect(parsed.state.inputMode).toBe('mouse')
    // 瞬态不持久化
    expect(parsed.state.isPlaying).toBeUndefined()
    expect(parsed.state.currentBeat).toBeUndefined()
    expect(parsed.state.currentSubdivision).toBeUndefined()

    // 重建 store 从 storage hydrate
    const store2 = createMetronomeStore(fakeDeps(), { persist: true, storage })
    expect(store2.getState().bpm).toBe(90)
    expect(store2.getState().theme).toBe('light')
    expect(store2.getState().subdivision).toBe(2)
    expect(store2.getState().mode).toBe('metronome')
    expect(store2.getState().countInEnabled).toBe(false)
    expect(store2.getState().inputMode).toBe('mouse')
  })
})
