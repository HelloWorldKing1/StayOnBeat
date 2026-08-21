import { describe, expect, it, vi } from 'vitest'
import {
  INITIAL_STATE,
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
    dispose: vi.fn(),
  }
  const metronomeEngine = {
    start: vi.fn(async () => {}),
    stop: vi.fn(),
    setBpm: vi.fn(),
    setBeatsPerBar: vi.fn(),
    setAccentFirstBeat: vi.fn(),
    isPlaying: vi.fn(() => false),
    beatIndexAtAudioTime: vi.fn(() => -1),
    getConfig: vi.fn(() => ({ bpm: 120, beatsPerBar: 4, accentFirstBeat: true })),
    dispose: vi.fn(),
  }
  return { audioEngine, metronomeEngine } as unknown as MetronomeStoreDeps
}

describe('createMetronomeStore', () => {
  it('初始状态与 INITIAL_STATE 一致', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    const state = store.getState()
    expect({
      bpm: state.bpm,
      beatsPerBar: state.beatsPerBar,
      accentFirstBeat: state.accentFirstBeat,
      isPlaying: state.isPlaying,
      currentBeat: state.currentBeat,
    }).toEqual(INITIAL_STATE)
  })

  it('start 委托引擎并进入播放态', async () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    await store.getState().start()
    expect(fakes.metronomeEngine!.start).toHaveBeenCalled()
    expect(store.getState().isPlaying).toBe(true)
    expect(store.getState().currentBeat).toBe(-1)
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
    store.setState({ isPlaying: true, currentBeat: 1 })
    store.getState().stop()
    expect(fakes.metronomeEngine!.stop).toHaveBeenCalled()
    expect(store.getState().isPlaying).toBe(false)
    expect(store.getState().currentBeat).toBe(-1)
  })

  it('setBpm 夹取并委托引擎，播放中重置 currentBeat', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setBpm(999)
    expect(store.getState().bpm).toBe(240)
    expect(fakes.metronomeEngine!.setBpm).toHaveBeenCalledWith(240)
    expect(store.getState().currentBeat).toBe(-1)

    store.setState({ isPlaying: true, currentBeat: 2 })
    store.getState().setBpm(90)
    expect(store.getState().currentBeat).toBe(-1)
  })

  it('setBeatsPerBar 夹取并委托引擎', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setBeatsPerBar(0)
    expect(store.getState().beatsPerBar).toBe(1)
    expect(fakes.metronomeEngine!.setBeatsPerBar).toHaveBeenCalledWith(1)
  })

  it('setAccentFirstBeat 同步状态与引擎', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState().setAccentFirstBeat(false)
    expect(store.getState().accentFirstBeat).toBe(false)
    expect(fakes.metronomeEngine!.setAccentFirstBeat).toHaveBeenCalledWith(false)
  })

  it('_setCurrentBeat 仅更新 currentBeat', () => {
    const fakes = fakeDeps()
    const store = createMetronomeStore(fakes)
    store.getState()._setCurrentBeat(3)
    expect(store.getState().currentBeat).toBe(3)
  })
})
