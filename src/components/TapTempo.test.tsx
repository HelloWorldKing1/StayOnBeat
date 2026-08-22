import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { TapTempo } from './TapTempo'

const TAP_HINT_TEXT = '按想要的节奏点击「Tap BPM」至少 4 次'

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

  it('Tap BPM 按钮带悬浮介绍层', () => {
    render(<TapTempo />)
    const btn = screen.getByRole('button', { name: 'Tap BPM' })
    const hintId = btn.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    const hint = document.getElementById(hintId!)
    expect(hint).toBeTruthy()
    expect(hint).toHaveAttribute('role', 'tooltip')
    expect(hint).toHaveTextContent(TAP_HINT_TEXT)
  })

  it('敲得过快时显示「最高设置到240」提示', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    render(<TapTempo />)
    const btn = screen.getByRole('button', { name: 'Tap BPM' })
    const tapAt = (t: number) => {
      now = t
      fireEvent.click(btn)
    }
    tapAt(0)
    tapAt(50)
    tapAt(100)
    tapAt(150)

    expect(screen.getByText('敲太快了，最高给您设置到240')).toBeInTheDocument()
  })

  it('敲击超过 240 BPM（150ms）时也显示放慢提示', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    render(<TapTempo />)
    const btn = screen.getByRole('button', { name: 'Tap BPM' })
    const tapAt = (t: number) => {
      now = t
      fireEvent.click(btn)
    }
    tapAt(0)
    tapAt(150)
    tapAt(300)
    tapAt(450)

    expect(screen.getByText(/敲太快了/)).toBeInTheDocument()
    expect(screen.getByText(/≈240/)).toBeInTheDocument()
  })

  it('应用为绿色、重置为蓝色', () => {
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

    const apply = screen.getByRole('button', { name: '应用 BPM' })
    const resetBtn = screen.getByRole('button', { name: '重置 Tap' })
    expect(apply.className).toContain('bg-[var(--success)]')
    expect(resetBtn.className).toContain('bg-[var(--info)]')
  })
})
