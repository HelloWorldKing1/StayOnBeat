import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { TapTempo } from './TapTempo'

afterEach(() => {
  resetMetronomeStore()
  vi.restoreAllMocks()
})

describe('TapTempo', () => {
  it('4 次点击后显示估算，应用后更新 store.bpm', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    render(<TapTempo />)

    const btn = screen.getByRole('button', { name: 'Tap BPM' })
    const tapAt = (t: number) => {
      now = t
      fireEvent.click(btn)
    }
    tapAt(0)
    tapAt(500)
    tapAt(1000)
    tapAt(1500)

    expect(screen.getByText(/≈120/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '应用 BPM' }))
    expect(useMetronomeStore.getState().bpm).toBe(120)
  })
})
