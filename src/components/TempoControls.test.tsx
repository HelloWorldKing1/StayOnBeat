import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { TempoControls } from './TempoControls'

afterEach(() => {
  resetMetronomeStore()
})

describe('TempoControls', () => {
  it('滑块改变 BPM 并写回 store', () => {
    render(<TempoControls />)
    fireEvent.change(screen.getByRole('slider', { name: 'BPM' }), {
      target: { value: '90' },
    })
    expect(useMetronomeStore.getState().bpm).toBe(90)
  })

  it('+/- 按钮步进 BPM', () => {
    render(<TempoControls />)
    fireEvent.click(screen.getByRole('button', { name: '提高 BPM' }))
    expect(useMetronomeStore.getState().bpm).toBe(121)

    fireEvent.click(screen.getByRole('button', { name: '降低 BPM' }))
    expect(useMetronomeStore.getState().bpm).toBe(120)
  })

  it('bpm=1 时降低按钮禁用', () => {
    useMetronomeStore.setState({ bpm: 1 })
    render(<TempoControls />)
    expect(screen.getByRole('button', { name: '降低 BPM' })).toBeDisabled()
  })

  it('bpm=240 时提高按钮禁用', () => {
    useMetronomeStore.setState({ bpm: 240 })
    render(<TempoControls />)
    expect(screen.getByRole('button', { name: '提高 BPM' })).toBeDisabled()
  })
})
