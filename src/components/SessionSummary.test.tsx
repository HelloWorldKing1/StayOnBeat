import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useTrainingStore } from '../store/useTrainingStore'
import { SessionSummary } from './SessionSummary'

function setResult() {
  useTrainingStore.setState({
    phase: 'summary',
    result: {
      status: 'completed',
      bpm: 120,
      beatsPerBar: 4,
      subdivision: 1,
      durationMs: 61000,
      accuracy: 92.5,
      grade: 'A',
      maxCombo: 34,
      avgOffsetMs: 18,
      stdOffsetMs: 11,
      earlyRate: 0.12,
      lateRate: 0.21,
      judgements: { perfect: 80, great: 10, good: 4, miss: 6 },
      hits: [],
    },
  })
}

afterEach(() => {
  useTrainingStore.getState().reset()
})

describe('SessionSummary', () => {
  it('无结果时不渲染', () => {
    const { container } = render(<SessionSummary />)
    expect(container).toBeEmptyDOMElement()
  })

  it('渲染匹配度/评级/判定分布/状态徽标', () => {
    setResult()
    render(<SessionSummary />)

    const summary = screen.getByTestId('session-summary')
    expect(summary).toHaveTextContent('92.5%')
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.getByText(/Perfect 80/)).toBeInTheDocument()
    expect(screen.getByText(/Great 10/)).toBeInTheDocument()
    expect(screen.getByText(/最大连击 34/)).toBeInTheDocument()
    expect(screen.getByText(/1:01/)).toBeInTheDocument()
  })

  it('再来一次/返回回调触发', () => {
    setResult()
    const onRetry = vi.fn()
    const onBack = vi.fn()
    render(<SessionSummary onRetry={onRetry} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: '再来一次' }))
    expect(onRetry).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(onBack).toHaveBeenCalled()
  })
})
