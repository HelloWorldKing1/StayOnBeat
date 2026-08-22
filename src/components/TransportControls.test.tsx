import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { useTrainingStore } from '../store/useTrainingStore'
import { TransportControls } from './TransportControls'

// 注入假引擎，避免 jsdom 下 new AudioContext() 崩溃
const fakeMetronomeEngine = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(),
  setBpm: vi.fn(),
  setBeatsPerBar: vi.fn(),
  setAccentFirstBeat: vi.fn(),
  setSubdivision: vi.fn(),
  setTimerSeconds: vi.fn(),
  setOnStopped: vi.fn(),
  addOnStopped: vi.fn(() => vi.fn()),
  isPlaying: vi.fn(() => false),
  currentAudioTime: vi.fn(() => 0),
  getFirstBeatTime: vi.fn(() => 0.06),
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
}))

vi.mock('../engine/audioEngine', () => ({
  createAudioEngine: () => ({
    context: null,
    ensureContext: vi.fn(() => ({ currentTime: 0, state: 'running' })),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    scheduleBeat: vi.fn(() => ({ stop: vi.fn() })),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    isMuted: vi.fn(() => false),
    dispose: vi.fn(),
  }),
}))

vi.mock('../engine/metronomeEngine', () => ({
  createMetronomeEngine: () => fakeMetronomeEngine,
}))

beforeEach(() => {
  useMetronomeStore.setState({ mode: 'metronome' })
})

afterEach(() => {
  resetMetronomeStore()
  useTrainingStore.getState().reset()
  vi.clearAllMocks()
})

describe('TransportControls', () => {
  it('节拍器模式：开始/停止切换', async () => {
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

  it('训练模式：显示「开始训练」，点击后进入 countIn 显示「停止」', async () => {
    useMetronomeStore.setState({ mode: 'training' })
    render(<TransportControls />)
    const btn = screen.getByRole('button', { name: '开始训练' })

    fireEvent.click(btn)
    expect(await screen.findByRole('button', { name: '停止' })).toBeInTheDocument()
    expect(fakeMetronomeEngine.start).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '停止' }))
    expect(await screen.findByRole('button', { name: '开始训练' })).toBeInTheDocument()
  })
})
