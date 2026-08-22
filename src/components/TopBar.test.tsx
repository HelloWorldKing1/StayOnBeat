import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { useTrainingStore } from '../store/useTrainingStore'
import { TopBar } from './TopBar'

afterEach(() => {
  resetMetronomeStore()
  useTrainingStore.getState().reset()
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

  it('模式切换按钮显示切换动作并更新 store.mode', () => {
    render(<TopBar onOpenSettings={() => {}} />)
    const btn = screen.getByRole('button', { name: '切换节拍器' })
    expect(btn).toHaveTextContent('切换节拍器')
    fireEvent.click(btn)
    expect(useMetronomeStore.getState().mode).toBe('metronome')
    expect(btn).toHaveTextContent('切换训练模式')
  })

  it('切换模式时若节拍器在播放则先停止', () => {
    useMetronomeStore.setState({ mode: 'metronome', isPlaying: true })
    render(<TopBar onOpenSettings={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '切换训练模式' }))
    expect(useMetronomeStore.getState().mode).toBe('training')
    expect(useMetronomeStore.getState().isPlaying).toBe(false)
  })

  it('切换模式时若训练进行中则中止', () => {
    useMetronomeStore.setState({ mode: 'training' })
    useTrainingStore.setState({ phase: 'training' })
    render(<TopBar onOpenSettings={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '切换节拍器' }))
    expect(useMetronomeStore.getState().mode).toBe('metronome')
    expect(useTrainingStore.getState().phase).toBe('summary')
  })

  it('设置按钮触发 onOpenSettings', () => {
    const onOpenSettings = vi.fn()
    render(<TopBar onOpenSettings={onOpenSettings} />)
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    expect(onOpenSettings).toHaveBeenCalled()
  })
})
