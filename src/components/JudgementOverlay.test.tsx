import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useTrainingStore } from '../store/useTrainingStore'
import { JudgementOverlay } from './JudgementOverlay'

afterEach(() => {
  useTrainingStore.getState().reset()
})

describe('JudgementOverlay', () => {
  it('无判定时不渲染', () => {
    const { container } = render(<JudgementOverlay />)
    expect(container).toBeEmptyDOMElement()
  })

  it('显示当前判定词', () => {
    useTrainingStore.setState({ lastJudgement: 'great' })
    render(<JudgementOverlay />)
    expect(screen.getByTestId('judgement')).toHaveTextContent('Great')
  })
})
