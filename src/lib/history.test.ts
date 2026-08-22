import { describe, expect, it } from 'vitest'
import {
  createHistoryStore,
  createMemoryHistoryStorage,
  type HistoryRecord,
} from './history'

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
    endedAt: 61000,
    ...overrides,
  }
}

describe('createHistoryStore', () => {
  it('save/list 往返并按 endedAt 倒序', async () => {
    const store = createHistoryStore(createMemoryHistoryStorage())
    await store.save(makeRecord({ id: 'a', accuracy: 80, endedAt: 3000 }))
    await store.save(makeRecord({ id: 'b', accuracy: 95, endedAt: 5000 }))
    await store.save(makeRecord({ id: 'c', accuracy: 90, endedAt: 4000 }))

    const list = await store.list()
    expect(list.map((r) => r.id)).toEqual(['b', 'c', 'a'])
    expect(list[0].accuracy).toBe(95)
  })

  it('clear 清空全部记录', async () => {
    const store = createHistoryStore(createMemoryHistoryStorage())
    await store.save(makeRecord({ id: 'a' }))
    await store.clear()
    expect(await store.list()).toHaveLength(0)
  })
})
