import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { TransportControls } from './TransportControls'

// 注入假引擎，避免 jsdom 下 new AudioContext() 崩溃
const fakeMetronomeEngine = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(),
  setBpm: vi.fn(),
  setBeatsPerBar: vi.fn(),
  setAccentFirstBeat: vi.fn(),
  isPlaying: vi.fn(() => false),
  beatIndexAtAudioTime: vi.fn(() => -1),
  getConfig: vi.fn(() => ({ bpm: 120, beatsPerBar: 4, accentFirstBeat: true })),
  dispose: vi.fn(),
}))

vi.mock('../engine/audioEngine', () => ({
  createAudioEngine: () => ({
    context: null,
    ensureContext: vi.fn(() => ({ currentTime: 0, state: 'running' })),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    scheduleBeat: vi.fn(() => ({ stop: vi.fn() })),
    setVolume: vi.fn(),
    dispose: vi.fn(),
  }),
}))

vi.mock('../engine/metronomeEngine', () => ({
  createMetronomeEngine: () => fakeMetronomeEngine,
}))

afterEach(() => {
  resetMetronomeStore()
  vi.clearAllMocks()
})

describe('TransportControls', () => {
  it('未播放时显示「开始」，点击后进入播放态并显示「停止」', async () => {
    render(<TransportControls />)
    expect(screen.getByRole('button', { name: '开始' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    expect(await screen.findByRole('button', { name: '停止' })).toBeInTheDocument()
    expect(fakeMetronomeEngine.start).toHaveBeenCalled()
    expect(useMetronomeStore.getState().isPlaying).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: '停止' }))
    expect(await screen.findByRole('button', { name: '开始' })).toBeInTheDocument()
    expect(fakeMetronomeEngine.stop).toHaveBeenCalled()
    expect(useMetronomeStore.getState().isPlaying).toBe(false)
  })
})
