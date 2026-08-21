import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { BeatSettings } from './BeatSettings'

afterEach(() => {
  resetMetronomeStore()
})

describe('BeatSettings', () => {
  it('切换拍号更新 beatsPerBar', () => {
    render(<BeatSettings />)
    fireEvent.change(screen.getByLabelText('每小节拍数'), { target: { value: '3' } })
    expect(useMetronomeStore.getState().beatsPerBar).toBe(3)
  })

  it('切换重音开关更新 accentFirstBeat', () => {
    render(<BeatSettings />)
    const checkbox = screen.getByLabelText('重音') as HTMLInputElement
    expect(checkbox.checked).toBe(true)

    fireEvent.click(checkbox)
    expect(useMetronomeStore.getState().accentFirstBeat).toBe(false)
    expect(checkbox.checked).toBe(false)
  })
})
