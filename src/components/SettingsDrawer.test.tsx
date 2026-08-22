import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { SettingsDrawer } from './SettingsDrawer'

afterEach(() => {
  resetMetronomeStore()
})

describe('SettingsDrawer', () => {
  it('关闭时不渲染内容', () => {
    const { container } = render(<SettingsDrawer open={false} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('音量滑块更新 store.volume', () => {
    render(<SettingsDrawer open onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('音量'), { target: { value: '0.8' } })
    expect(useMetronomeStore.getState().volume).toBeCloseTo(0.8)
  })

  it('静音开关与主题按钮联动 store', () => {
    render(<SettingsDrawer open onClose={() => {}} />)
    const mute = screen.getByLabelText('静音') as HTMLInputElement
    fireEvent.click(mute)
    expect(useMetronomeStore.getState().muted).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '切换主题' }))
    expect(useMetronomeStore.getState().theme).toBe('light')
  })

  it('点背景遮罩调用 onClose，点面板内部不关闭', () => {
    const onClose = vi.fn()
    render(<SettingsDrawer open onClose={onClose} />)
    fireEvent.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
