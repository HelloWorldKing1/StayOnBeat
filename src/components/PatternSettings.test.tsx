import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { PatternSettings } from './PatternSettings'

afterEach(() => {
  resetMetronomeStore()
})

describe('PatternSettings', () => {
  it('切换拍号更新 beatsPerBar', () => {
    render(<PatternSettings />)
    fireEvent.change(screen.getByLabelText('每小节拍数'), { target: { value: '3' } })
    expect(useMetronomeStore.getState().beatsPerBar).toBe(3)
  })

  it('切换重音开关更新 accentFirstBeat', () => {
    render(<PatternSettings />)
    const checkbox = screen.getByLabelText('重音') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
    fireEvent.click(checkbox)
    expect(useMetronomeStore.getState().accentFirstBeat).toBe(false)
  })

  it('切换细分更新 subdivision', () => {
    render(<PatternSettings />)
    fireEvent.change(screen.getByLabelText('细分'), { target: { value: '2' } })
    expect(useMetronomeStore.getState().subdivision).toBe(2)
  })

  it('计时器选「无限」→ timerSeconds null', () => {
    render(<PatternSettings />)
    fireEvent.change(screen.getByLabelText('计时器'), { target: { value: 'infinite' } })
    expect(useMetronomeStore.getState().timerSeconds).toBeNull()
  })

  it('计时器选预设 15 → timerSeconds 15', () => {
    render(<PatternSettings />)
    fireEvent.change(screen.getByLabelText('计时器'), { target: { value: '15' } })
    expect(useMetronomeStore.getState().timerSeconds).toBe(15)
  })

  it('计时器自定义输入更新 timerSeconds 并夹取到 1–3600', () => {
    render(<PatternSettings />)
    fireEvent.change(screen.getByLabelText('计时器'), { target: { value: 'custom' } })
    const input = screen.getByLabelText('自定义计时秒数')

    fireEvent.change(input, { target: { value: '4000' } })
    expect(useMetronomeStore.getState().timerSeconds).toBe(3600)

    fireEvent.change(input, { target: { value: '2' } })
    expect(useMetronomeStore.getState().timerSeconds).toBe(2)
  })
})
