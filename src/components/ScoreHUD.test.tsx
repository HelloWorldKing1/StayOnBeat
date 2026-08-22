import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useTrainingStore } from '../store/useTrainingStore'
import { ScoreHUD } from './ScoreHUD'

function setSession() {
  useTrainingStore.setState({
    session: {
      firstScoringTime: 0,
      bpm: 120,
      beatsPerBar: 4,
      subdivision: 1,
      spSub: 0.5,
      goodWindowMs: 120,
      nextExpectedIndex: 1,
      hits: [],
      judgements: { perfect: 1, great: 0, good: 0, miss: 0 },
      combo: 3,
      maxCombo: 3,
      totalScore: 100,
      resolvedCount: 1,
      earlyCount: 0,
      lateCount: 1,
    },
    lastJudgement: 'perfect',
    lastOffsetMs: 12,
  })
}

afterEach(() => {
  useTrainingStore.getState().reset()
})

describe('ScoreHUD', () => {
  it('无会话时显示 0% / 0 连击', () => {
    render(<ScoreHUD />)
    expect(screen.getByText('匹配度')).toBeInTheDocument()
    expect(screen.getByText('0.0%')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('有会话时显示匹配度、连击与当前判定/早晚', () => {
    setSession()
    render(<ScoreHUD />)
    expect(screen.getByText('100.0%')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    const j = screen.getByTestId('last-judgement')
    expect(j).toHaveTextContent('Perfect')
    expect(j).toHaveTextContent('12ms 晚')
  })
})
