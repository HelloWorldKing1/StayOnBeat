import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTapTempo } from './useTapTempo'

describe('useTapTempo', () => {
  it('4 次点击后给出估算', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTapTempo())

    act(() => {
      now = 0
      result.current.onTap()
      now = 500
      result.current.onTap()
      now = 1000
      result.current.onTap()
      now = 1500
      result.current.onTap()
    })

    expect(result.current.taps).toBe(4)
    expect(result.current.estimatedBpm).toBe(120)
  })

  it('间隔超过 maxGapMs 时重置序列', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTapTempo())

    act(() => {
      now = 0
      result.current.onTap()
      now = 500
      result.current.onTap()
      now = 4000 // gap 3500 > 2500 → 重置
      result.current.onTap()
      now = 4500
      result.current.onTap()
    })

    // 重置后只剩 2 次点击（4000、4500）
    expect(result.current.taps).toBe(2)
    expect(result.current.estimatedBpm).toBeNull()
  })

  it('reset 清空状态', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTapTempo())

    act(() => {
      now = 0
      result.current.onTap()
      now = 500
      result.current.onTap()
      now = 1000
      result.current.onTap()
      now = 1500
      result.current.onTap()
    })
    expect(result.current.estimatedBpm).toBe(120)

    act(() => result.current.reset())
    expect(result.current.taps).toBe(0)
    expect(result.current.estimatedBpm).toBeNull()
  })
})
