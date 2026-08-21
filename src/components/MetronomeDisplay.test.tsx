import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { resetMetronomeStore, useMetronomeStore } from '../store/useMetronomeStore'
import { MetronomeDisplay } from './MetronomeDisplay'

afterEach(() => {
  resetMetronomeStore()
})

describe('MetronomeDisplay', () => {
  it('渲染 BPM、速度术语与对应数量的拍点灯', () => {
    useMetronomeStore.setState({ bpm: 120, beatsPerBar: 4 })
    render(<MetronomeDisplay />)

    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText(/Moderato/)).toBeInTheDocument()
    expect(screen.getAllByTestId('beat-light')).toHaveLength(4)
  })

  it('当前拍高亮并带 aria-current，重音灯带 accent 标记', () => {
    useMetronomeStore.setState({ beatsPerBar: 4, currentBeat: 2 })
    render(<MetronomeDisplay />)

    const lights = screen.getAllByTestId('beat-light')
    expect(lights).toHaveLength(4)
    expect(lights[2]).toHaveAttribute('data-active', 'true')
    expect(lights[2]).toHaveAttribute('aria-current', 'true')
    expect(lights[0]).toHaveAttribute('data-accent', 'true')
    expect(lights[0]).not.toHaveAttribute('aria-current')
  })

  it('未播放时（currentBeat=-1）没有点亮任何灯', () => {
    useMetronomeStore.setState({ beatsPerBar: 4, currentBeat: -1 })
    render(<MetronomeDisplay />)

    const lights = screen.getAllByTestId('beat-light')
    for (const light of lights) {
      expect(light).toHaveAttribute('data-active', 'false')
    }
  })
})
