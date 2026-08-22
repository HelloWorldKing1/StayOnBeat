import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createHistoryStore,
  createMemoryHistoryStorage,
  type HistoryRecord,
} from '../lib/history'
import { HistoryPanel } from './HistoryPanel'

function makeRecord(overrides: Partial<HistoryRecord> = {}): HistoryRecord {
  return {
    id: 'x',
    status: 'completed',
    bpm: 120,
    beatsPerBar: 4,
    subdivision: 1,
    durationMs: 60000,
    accuracy: 92.5,
    grade: 'A',
    maxCombo: 34,
    avgOffsetMs: 18,
    stdOffsetMs: 11,
    earlyRate: 0.12,
    lateRate: 0.21,
    judgements: { perfect: 80, great: 10, good: 4, miss: 6 },
    hits: [],
    startedAt: 1000,
    endedAt: 2000,
    ...overrides,
  }
}

describe('HistoryPanel', () => {
  it('空存储显示暂无记录', async () => {
    const store = createHistoryStore(createMemoryHistoryStorage())
    render(<HistoryPanel store={store} />)
    expect(await screen.findByText('暂无记录')).toBeInTheDocument()
  })

  it('有记录时渲染列表与基础统计', async () => {
    const store = createHistoryStore(createMemoryHistoryStorage())
    await store.save(makeRecord({ id: 'a', accuracy: 80, grade: 'B' }))
    await store.save(makeRecord({ id: 'b', accuracy: 95, grade: 'S' }))
    render(<HistoryPanel store={store} />)

    expect(await screen.findByText(/共 2 次/)).toBeInTheDocument()
    expect(screen.getByText(/平均 87.5%/)).toBeInTheDocument()
    expect(screen.getByText(/最高 95.0%/)).toBeInTheDocument()
  })
})
