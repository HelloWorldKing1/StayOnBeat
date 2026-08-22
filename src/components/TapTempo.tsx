import { useTapTempo } from '../hooks/useTapTempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

export function TapTempo() {
  const setBpm = useMetronomeStore((s) => s.setBpm)
  const { taps, estimatedBpm, onTap, reset } = useTapTempo()

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      <button
        type="button"
        aria-label="Tap BPM"
        onClick={onTap}
        className="rounded-full border border-[var(--border)] px-4 py-1"
      >
        Tap BPM
      </button>
      {taps > 0 && <span className="text-[var(--text-secondary)]">已点 {taps} 次</span>}
      {estimatedBpm != null && (
        <>
          <span className="tabular-nums text-[var(--text-secondary)]">
            ≈{estimatedBpm}
          </span>
          <button
            type="button"
            aria-label="应用 BPM"
            onClick={() => {
              setBpm(estimatedBpm)
              reset()
            }}
            className="rounded-full border border-[var(--border)] px-3 py-1"
          >
            应用
          </button>
          <button
            type="button"
            aria-label="重置 Tap"
            onClick={reset}
            className="rounded-full border border-[var(--border)] px-3 py-1"
          >
            重置
          </button>
        </>
      )}
    </div>
  )
}
