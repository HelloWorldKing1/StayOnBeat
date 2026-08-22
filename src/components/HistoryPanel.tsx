import { useEffect, useState } from 'react'
import { historyStore, type HistoryRecord, type HistoryStore } from '../lib/history'

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface HistoryPanelProps {
  store?: HistoryStore
}

export function HistoryPanel({ store = historyStore }: HistoryPanelProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [version, setVersion] = useState(0)

  // 保存/清空后重载，保证新会话结果立即出现
  useEffect(() => {
    return store.subscribe(() => setVersion((v) => v + 1))
  }, [store])

  useEffect(() => {
    let cancelled = false
    void store
      .list()
      .then((r) => {
        if (!cancelled) setRecords(r)
      })
      .catch(() => {
        // jsdom 等无 IndexedDB 环境降级为空
        if (!cancelled) setRecords([])
      })
    return () => {
      cancelled = true
    }
  }, [store, version])

  const count = records.length
  const avg = count ? records.reduce((a, r) => a + r.accuracy, 0) / count : 0
  const best = count ? Math.max(...records.map((r) => r.accuracy)) : 0

  return (
    <section data-testid="history-panel" className="w-full max-w-md text-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">历史记录</h2>
        <button
          type="button"
          aria-label="清空历史"
          disabled={records.length === 0}
          onClick={() => void store.clear()}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs disabled:opacity-40"
        >
          清空历史
        </button>
      </div>
      {count > 0 && (
        <p className="mb-2 text-[var(--text-secondary)]">
          共 {count} 次 · 平均 {avg.toFixed(1)}% · 最高 {best.toFixed(1)}%
        </p>
      )}
      {records.length === 0 ? (
        <p className="text-[var(--text-secondary)]">暂无记录</p>
      ) : (
        <ul className="space-y-1">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex justify-between border-b border-[var(--border)] py-1"
            >
              <span>
                {formatTime(r.endedAt)} · {r.bpm} BPM
              </span>
              <span className="tabular-nums">
                {r.accuracy.toFixed(1)}% <strong>{r.grade}</strong>
                {r.status === 'aborted' ? '（中止）' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
