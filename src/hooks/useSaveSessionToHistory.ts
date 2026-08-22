import { useEffect, useRef } from 'react'
import { historyStore, type HistoryRecord, type HistoryStore } from '../lib/history'
import { useTrainingStore } from '../store/useTrainingStore'

/**
 * 训练进入 summary 且有结果时，补 id/startedAt/endedAt 保存一次到历史。
 * 按 result 引用去重，避免重复渲染重复保存；训练 store 保持纯。
 */
export function useSaveSessionToHistory(store: HistoryStore = historyStore): void {
  const phase = useTrainingStore((s) => s.phase)
  const result = useTrainingStore((s) => s.result)
  const savedRef = useRef<object | null>(null)

  useEffect(() => {
    if (phase !== 'summary' || !result) return
    if (savedRef.current === result) return
    savedRef.current = result
    const session = useTrainingStore.getState().session
    const record: HistoryRecord = {
      ...result,
      id: crypto.randomUUID(),
      startedAt: session?.startedAt ?? Date.now(),
      endedAt: session?.endedAt ?? Date.now(),
    }
    void store.save(record)
  }, [phase, result, store])
}
