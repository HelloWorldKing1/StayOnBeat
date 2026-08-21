import { describe, expect, it } from 'vitest'
import {
  ACCENT_FREQ,
  BEAT_FREQ,
  createAudioEngine,
  type AudioEngine,
} from './audioEngine'
import { createFakeAudioContext, type FakeAudioContext } from '../test/fakeAudioContext'

function makeEngine(fakeCtx: FakeAudioContext): AudioEngine {
  return createAudioEngine({
    createAudioContext: () => fakeCtx as unknown as AudioContext,
  })
}

describe('createAudioEngine', () => {
  it('ensureContext 惰性创建且幂等', () => {
    const fakeCtx = createFakeAudioContext()
    const engine = makeEngine(fakeCtx)
    expect(engine.context).toBeNull()

    const ctx1 = engine.ensureContext()
    const ctx2 = engine.ensureContext()
    expect(ctx1).toBe(fakeCtx)
    expect(ctx2).toBe(fakeCtx)
    expect(fakeCtx.createGain).toHaveBeenCalledTimes(1)
    expect(fakeCtx.createOscillator).not.toHaveBeenCalled()
  })

  it('scheduleBeat 按重音/普通使用不同频率并写入正确时间', () => {
    const fakeCtx = createFakeAudioContext()
    const engine = makeEngine(fakeCtx)

    engine.scheduleBeat(1, { accent: true })
    engine.scheduleBeat(1.5, { accent: false })

    const oscs = fakeCtx.createOscillator.mock.results.map((r) => r.value)
    expect(oscs).toHaveLength(2)
    expect(oscs[0].frequency.value).toBe(ACCENT_FREQ)
    expect(oscs[1].frequency.value).toBe(BEAT_FREQ)
    expect(oscs[0].type).toBe('sine')
    expect(oscs[0].start).toHaveBeenCalledWith(1)
    expect(oscs[0].stop).toHaveBeenCalledWith(1.06)
    expect(oscs[1].start).toHaveBeenCalledWith(1.5)
  })

  it('scheduleBeat 使用指数包络到达目标音量', () => {
    const fakeCtx = createFakeAudioContext()
    const engine = makeEngine(fakeCtx)
    engine.ensureContext()

    engine.scheduleBeat(0, { accent: false })
    const gain = fakeCtx.createGain.mock.results[1].value
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 0)
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.5, 0.002)
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 0.05)
  })

  it('setVolume 夹取 0–1 并写入 masterGain', () => {
    const fakeCtx = createFakeAudioContext()
    const engine = makeEngine(fakeCtx)
    engine.ensureContext()
    const masterGain = fakeCtx.createGain.mock.results[0].value

    engine.setVolume(2)
    expect(masterGain.gain.value).toBe(1)
    engine.setVolume(-1)
    expect(masterGain.gain.value).toBe(0)
    engine.setVolume(0.3)
    expect(masterGain.gain.value).toBe(0.3)
  })

  it('stop 句柄可撤销且重复 stop 不抛错', () => {
    const fakeCtx = createFakeAudioContext()
    const engine = makeEngine(fakeCtx)

    const beat = engine.scheduleBeat(0, { accent: false })
    expect(() => beat.stop()).not.toThrow()
    expect(() => beat.stop()).not.toThrow()
  })

  it('dispose 后 ensureContext 重建新实例', async () => {
    const fake1 = createFakeAudioContext()
    const fake2 = createFakeAudioContext()
    let calls = 0
    const engine = createAudioEngine({
      createAudioContext: () =>
        (++calls === 1 ? fake1 : fake2) as unknown as AudioContext,
    })

    expect(engine.ensureContext()).toBe(fake1)
    engine.dispose()
    expect(engine.context).toBeNull()
    expect(fake1.close).toHaveBeenCalled()

    expect(engine.ensureContext()).toBe(fake2)
    expect(calls).toBe(2)
  })
})
