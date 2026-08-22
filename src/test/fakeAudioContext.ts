import { vi } from 'vitest'

export interface FakeAudioParam {
  value: number
  setValueAtTime: ReturnType<typeof vi.fn>
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
}

export interface FakeAudioNode {
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

export interface FakeOscillator extends FakeAudioNode {
  type: string
  frequency: { value: number }
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

export interface FakeGain extends FakeAudioNode {
  gain: FakeAudioParam
}

export interface FakeAudioContext {
  currentTime: number
  destination: Record<string, never>
  state: 'running' | 'suspended' | 'closed'
  resume: ReturnType<typeof vi.fn>
  suspend: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  createOscillator: ReturnType<typeof vi.fn>
  createGain: ReturnType<typeof vi.fn>
}

/**
 * 确定性假 AudioContext，供 audioEngine / metronomeEngine 测试使用。
 * currentTime 可由测试手动推进，节点与方法是 vi.fn() 便于断言调用参数。
 */
export function createFakeAudioContext(initialCurrentTime = 0): FakeAudioContext {
  const ctx: FakeAudioContext = {
    currentTime: initialCurrentTime,
    destination: {},
    state: 'running',
    resume: vi.fn(async () => {
      ctx.state = 'running'
    }),
    suspend: vi.fn(async () => {
      ctx.state = 'suspended'
    }),
    close: vi.fn(async () => {
      ctx.state = 'closed'
    }),
    createOscillator: vi.fn((): FakeOscillator => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn((): FakeGain => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
  }
  return ctx
}
