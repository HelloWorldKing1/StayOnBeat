import { useTrainingStore } from '../store/useTrainingStore'

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface SessionSummaryProps {
  onRetry?: () => void
  onBack?: () => void
}

export function SessionSummary({ onRetry, onBack }: SessionSummaryProps) {
  const result = useTrainingStore((s) => s.result)
  if (!result) return null

  return (
    <section
      data-testid="session-summary"
      className="flex flex-col items-center gap-3 text-center"
    >
      <div className="text-6xl font-bold tabular-nums">
        {result.accuracy.toFixed(1)}%
      </div>
      <div className="flex items-center gap-2 text-lg">
        评级 <strong>{result.grade}</strong>
        <span
          className={`rounded-full border border-[var(--border)] px-2 py-0.5 text-xs ${
            result.status === 'completed' ? 'text-[#50C391]' : 'text-[#E45756]'
          }`}
        >
          {result.status === 'completed' ? '已完成' : '已中止'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <span>Perfect {result.judgements.perfect}</span>
        <span>Great {result.judgements.great}</span>
        <span>Good {result.judgements.good}</span>
        <span>Miss {result.judgements.miss}</span>
        <span>最大连击 {result.maxCombo}</span>
        <span>平均偏差 {result.avgOffsetMs.toFixed(0)}ms</span>
        <span>标准差 {result.stdOffsetMs.toFixed(0)}ms</span>
        <span>
          早/晚 {Math.round(result.earlyRate * 100)}%/
          {Math.round(result.lateRate * 100)}%
        </span>
        <span>时长 {formatDuration(result.durationMs)}</span>
        <span>
          BPM {result.bpm} · {result.beatsPerBar} 拍 · 细分 {result.subdivision}
        </span>
      </div>
      {(onRetry || onBack) && (
        <div className="mt-2 flex gap-3">
          {onRetry && (
            <button
              type="button"
              aria-label="再来一次"
              onClick={onRetry}
              className="rounded-full bg-[var(--primary)] px-5 py-2 font-semibold text-white"
            >
              再来一次
            </button>
          )}
          {onBack && (
            <button
              type="button"
              aria-label="返回"
              onClick={onBack}
              className="rounded-full border border-[var(--border)] px-5 py-2"
            >
              返回
            </button>
          )}
        </div>
      )}
    </section>
  )
}
