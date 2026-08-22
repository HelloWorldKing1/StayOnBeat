import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { useTrainingInput } from './useTrainingInput'

describe('useTrainingInput', () => {
  it('过滤 event.repeat', () => {
    const onHit = vi.fn()
    const padRef = createRef<HTMLElement>()
    renderHook(() => useTrainingInput({ onHit, enabled: true, padRef }))

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Space', bubbles: true }),
      )
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Space', bubbles: true, repeat: true }),
      )
    })
    expect(onHit).toHaveBeenCalledTimes(1)
  })

  it('50ms 去重窗口合并同源事件', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const onHit = vi.fn()
    const padRef = createRef<HTMLElement>()
    renderHook(() => useTrainingInput({ onHit, enabled: true, padRef }))

    act(() => {
      now = 1000
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }),
      )
      now = 1020
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }),
      )
    })
    expect(onHit).toHaveBeenCalledTimes(1)
  })

  it('焦点在按钮上时不拦截 Space（让按钮可激活）', () => {
    const onHit = vi.fn()
    const padRef = createRef<HTMLElement>()
    renderHook(() => useTrainingInput({ onHit, enabled: true, padRef }))
    const btn = document.createElement('button')
    btn.textContent = '停止'
    document.body.appendChild(btn)

    try {
      act(() => {
        fireEvent.keyDown(btn, { code: 'Space' })
      })
      expect(onHit).not.toHaveBeenCalled()
    } finally {
      document.body.removeChild(btn)
    }
  })
})
