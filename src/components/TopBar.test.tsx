import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { TopBar } from './TopBar'

afterEach(() => {
  resetMetronomeStore()
})

describe('TopBar', () => {
  it('主题切换同步 data-theme 与 store', () => {
    render(<TopBar onOpenSettings={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '切换主题' }))
    expect(useMetronomeStore.getState().theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('静音切换更新 store.muted', () => {
    useMetronomeStore.setState({ muted: true })
    render(<TopBar onOpenSettings={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '开启声音' }))
    expect(useMetronomeStore.getState().muted).toBe(false)
  })

  it('设置按钮触发 onOpenSettings', () => {
    const onOpenSettings = vi.fn()
    render(<TopBar onOpenSettings={onOpenSettings} />)
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    expect(onOpenSettings).toHaveBeenCalled()
  })
})
