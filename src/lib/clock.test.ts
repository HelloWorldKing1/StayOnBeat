import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClockBridge, type ClockContext } from './clock'

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

  it('校准始终使用 currentTime，忽略 getOutputTimestamp', () => {
    const bridge = createClockBridge()
    vi.spyOn(performance, 'now').mockReturnValue(2_000_000)
    const ctx = {
      currentTime: 50,
      getOutputTimestamp: () => ({ contextTime: 30, performanceTime: 1_500_000 }),
    }
    bridge.calibrate(ctx as unknown as ClockContext)

    // 以 currentTime=50 为基准，getOutputTimestamp 不生效
    expect(bridge.audioToPerfMs(50)).toBeCloseTo(2_000_000)
    expect(bridge.audioToPerfMs(30)).toBeCloseTo(1_980_000)
    expect(bridge.perfMsToAudio(2_000_000)).toBeCloseTo(50)
  })

  it('只传 currentTime 也能校准', () => {
    const bridge = createClockBridge()
    vi.spyOn(performance, 'now').mockReturnValue(500)
    bridge.calibrate({ currentTime: 0 })

    expect(bridge.audioToPerfMs(0)).toBeCloseTo(500)
    expect(bridge.audioToPerfMs(1)).toBeCloseTo(1500)
    expect(bridge.perfMsToAudio(500)).toBeCloseTo(0)
  })
})
