import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createHistoryStore, createMemoryHistoryStorage } from '../lib/history'
import { useTrainingStore } from '../store/useTrainingStore'
import { useSaveSessionToHistory } from './useSaveSessionToHistory'

function makeResult() {
  return {
    status: 'completed' as const,
    bpm: 120,
    beatsPerBar: 4,
    subdivision: 1 as const,
    durationMs: 60000,
    accuracy: 92.5,
    grade: 'A' as const,
    maxCombo: 34,
    avgOffsetMs: 18,
    stdOffsetMs: 11,
    earlyRate: 0.12,
    lateRate: 0.21,
    judgements: { perfect: 80, great: 10, good: 4, miss: 6 },
    hits: [],
  }
}

afterEach(() => {
  useTrainingStore.getState().reset()
})

describe('useSaveSessionToHistory', () => {
  it('summary 且有结果时保存一次，重复渲染不重复保存', async () => {
    const store = createHistoryStore(createMemoryHistoryStorage())
    useTrainingStore.setState({ phase: 'summary', result: makeResult() })

    const { rerender } = renderHook(() => useSaveSessionToHistory(store))
    await new Promise((r) => setTimeout(r, 0))
    expect(await store.list()).toHaveLength(1)

    const record = (await store.list())[0]
    expect(record.id).toBeTruthy()
    expect(record.startedAt).toBeGreaterThan(0)
    expect(record.endedAt).toBeGreaterThan(0)

    rerender()
    await new Promise((r) => setTimeout(r, 0))
    expect(await store.list()).toHaveLength(1)
  })

  it('非 summary 阶段不保存', async () => {
    const store = createHistoryStore(createMemoryHistoryStorage())
    useTrainingStore.setState({ phase: 'training', result: makeResult() })

    renderHook(() => useSaveSessionToHistory(store))
    await new Promise((r) => setTimeout(r, 0))
    expect(await store.list()).toHaveLength(0)
  })
})
