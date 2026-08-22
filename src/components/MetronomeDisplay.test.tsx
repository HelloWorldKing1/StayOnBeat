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

  it('静音时显示「仅视觉」徽标并标记 data-muted', () => {
    useMetronomeStore.setState({ muted: true })
    render(<MetronomeDisplay />)
    expect(screen.getByText('仅视觉')).toBeInTheDocument()
    expect(screen.getByLabelText('节拍器显示')).toHaveAttribute('data-muted', 'true')
  })

  it('data-current-sub 反映当前子拍序号', () => {
    useMetronomeStore.setState({ currentSubdivision: 1 })
    render(<MetronomeDisplay />)
    expect(screen.getByLabelText('节拍器显示')).toHaveAttribute('data-current-sub', '1')
  })

  it('活跃拍灯带子拍脉动动画与时长', () => {
    useMetronomeStore.setState({ beatsPerBar: 4, currentBeat: 2, subdivision: 2 })
    render(<MetronomeDisplay />)

    const lights = screen.getAllByTestId('beat-light')
    const active = lights[2]
    expect(active.className).toContain('beat-pulse')
    // 120 BPM、sub=2 → 每子拍 0.25s
    expect(active.style.animationDuration).toBe('250ms')
  })
})
