import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TrainingPad } from './TrainingPad'

describe('TrainingPad', () => {
  it('active 时点击 pad 触发 onHit', () => {
    const onHit = vi.fn()
    render(<TrainingPad onHit={onHit} active />)
    fireEvent.pointerDown(screen.getByRole('button', { name: '训练点击垫' }))
    expect(onHit).toHaveBeenCalledTimes(1)
  })

  it('非 active 时不触发 onHit', () => {
    const onHit = vi.fn()
    render(<TrainingPad onHit={onHit} active={false} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: '训练点击垫' }))
    expect(onHit).not.toHaveBeenCalled()
  })

  it('keydown Space 触发 onHit，pad 外 pointerdown 不触发', () => {
    const onHit = vi.fn()
    render(<TrainingPad onHit={onHit} active />)
    fireEvent.keyDown(window, { code: 'Space' })
    expect(onHit).toHaveBeenCalledTimes(1)

    fireEvent.pointerDown(document.body)
    expect(onHit).toHaveBeenCalledTimes(1)
  })
})
