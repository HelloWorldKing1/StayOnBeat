import { describe, expect, it } from 'vitest'
import { shouldRunBeatPulse } from './useBeatPulse'

describe('shouldRunBeatPulse', () => {
  it('节拍器 isPlaying 或训练进行中（countIn/training）驱动拍灯', () => {
    expect(shouldRunBeatPulse(true, 'idle')).toBe(true)
    expect(shouldRunBeatPulse(false, 'countIn')).toBe(true)
    expect(shouldRunBeatPulse(false, 'training')).toBe(true)
  })

  it('空闲/总结阶段不驱动', () => {
    expect(shouldRunBeatPulse(false, 'idle')).toBe(false)
    expect(shouldRunBeatPulse(false, 'ready')).toBe(false)
    expect(shouldRunBeatPulse(false, 'summary')).toBe(false)
  })
})
