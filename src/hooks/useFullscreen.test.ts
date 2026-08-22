import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFullscreen } from './useFullscreen'

function mockFullscreenApi(enabled: boolean) {
  const exitFullscreen = vi.fn(async () => {})
  const requestFullscreen = vi.fn(async () => {})
  Object.defineProperty(document, 'fullscreenEnabled', {
    value: enabled,
    configurable: true,
  })
  Object.defineProperty(document, 'fullscreenElement', {
    value: null,
    configurable: true,
  })
  document.exitFullscreen = exitFullscreen
  document.documentElement.requestFullscreen = requestFullscreen
  return { exitFullscreen, requestFullscreen }
}

describe('useFullscreen', () => {
  it('supported 取决于 fullscreenEnabled', () => {
    mockFullscreenApi(true)
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.supported).toBe(true)
    expect(result.current.isFullscreen).toBe(false)
  })

  it('toggle 进入/退出全屏并随 fullscreenchange 同步状态', async () => {
    const { requestFullscreen, exitFullscreen } = mockFullscreenApi(true)
    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      result.current.toggle()
    })
    expect(requestFullscreen).toHaveBeenCalled()

    Object.defineProperty(document, 'fullscreenElement', {
      value: document.documentElement,
      configurable: true,
    })
    await act(async () => {
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    expect(result.current.isFullscreen).toBe(true)

    await act(async () => {
      result.current.toggle()
    })
    expect(exitFullscreen).toHaveBeenCalled()

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      configurable: true,
    })
    await act(async () => {
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    expect(result.current.isFullscreen).toBe(false)
  })
})
