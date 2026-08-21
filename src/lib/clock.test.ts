import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClockBridge } from './clock'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createClockBridge', () => {
  it('校准后往返换算互为反函数', () => {
    const bridge = createClockBridge()
    const perfNow = 1_000_000
    vi.spyOn(performance, 'now').mockReturnValue(perfNow)
    bridge.calibrate({ currentTime: 10 })

    // 音频 11 秒 → perfNow + 1000 毫秒
    expect(bridge.audioToPerfMs(11)).toBeCloseTo(perfNow + 1000)
    // 反函数
    expect(bridge.perfMsToAudio(perfNow + 1000)).toBeCloseTo(11)
    // 任意值往返误差 < 1e-9
    expect(bridge.perfMsToAudio(bridge.audioToPerfMs(123.456))).toBeCloseTo(123.456, 9)
    expect(bridge.audioToPerfMs(bridge.perfMsToAudio(9_876_543.21))).toBeCloseTo(
      9_876_543.21,
      6,
    )
  })

  it('getOutputTimestamp 可用时优先用于校准', () => {
    const bridge = createClockBridge()
    vi.spyOn(performance, 'now').mockReturnValue(2_000_000)
    bridge.calibrate({
      currentTime: 50,
      getOutputTimestamp: () => ({ contextTime: 30, performanceTime: 1_500_000 }),
    })

    expect(bridge.audioToPerfMs(30)).toBeCloseTo(1_500_000)
    expect(bridge.perfMsToAudio(1_500_000)).toBeCloseTo(30)
  })

  it('无 getOutputTimestamp 时回退到 currentTime 校准', () => {
    const bridge = createClockBridge()
    vi.spyOn(performance, 'now').mockReturnValue(500)
    bridge.calibrate({ currentTime: 0 })

    expect(bridge.audioToPerfMs(0)).toBeCloseTo(500)
    expect(bridge.audioToPerfMs(1)).toBeCloseTo(1500)
    expect(bridge.perfMsToAudio(500)).toBeCloseTo(0)
  })

  it('getOutputTimestamp 返回 null 时回退不抛错', () => {
    const bridge = createClockBridge()
    vi.spyOn(performance, 'now').mockReturnValue(100)
    expect(() =>
      bridge.calibrate({ currentTime: 5, getOutputTimestamp: () => null }),
    ).not.toThrow()
    expect(bridge.audioToPerfMs(5)).toBeCloseTo(100)
  })
})
