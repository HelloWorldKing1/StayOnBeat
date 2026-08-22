import { useTapTempo } from '../hooks/useTapTempo'
import { MAX_BPM } from '../lib/tempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

interface TapTempoProps {
  disabled?: boolean
}

export function TapTempo({ disabled = false }: TapTempoProps) {
  const setBpm = useMetronomeStore((s) => s.setBpm)
  const { taps, estimatedBpm, tooFast, onTap, reset } = useTapTempo()

  return (
    <div className="flex flex-col items-center gap-3 text-sm">
      {/* Tap 按钮固定在上方居中，状态信息与按钮在下一行 */}
      <div className="group relative">
        <button
          type="button"
          aria-label="Tap BPM"
          aria-describedby="tap-tempo-hint"
          onClick={onTap}
          disabled={disabled}
          className="rounded-full border border-[var(--border)] px-4 py-1 disabled:opacity-40"
        >
          Tap BPM
        </button>
        <div
          id="tap-tempo-hint"
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2 text-xs text-[var(--text-primary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          按想要的节奏点击「Tap BPM」至少 4 次，出现估算 BPM
          后点「应用」即可设为主控速度；停顿 2.5 秒自动重置。
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {taps > 0 && (
          <span className="text-[var(--text-secondary)]">已点 {taps} 次</span>
        )}
        {estimatedBpm != null && (
          <>
            <span className="tabular-nums text-[var(--text-secondary)]">
              ≈{estimatedBpm}
            </span>
            {tooFast && (
              <span className="text-[var(--danger)]">
                敲太快了，最高给您设置到{MAX_BPM}
              </span>
            )}
            <button
              type="button"
              aria-label="应用 BPM"
              disabled={disabled}
              onClick={() => {
                setBpm(estimatedBpm)
                reset()
              }}
              className="rounded-full bg-[var(--success)] px-3 py-1 text-white disabled:opacity-40"
            >
              应用
            </button>
            <button
              type="button"
              aria-label="重置 Tap"
              disabled={disabled}
              onClick={reset}
              className="rounded-full bg-[var(--info)] px-3 py-1 text-white disabled:opacity-40"
            >
              重置
            </button>
          </>
        )}
        {tooFast && estimatedBpm === null && (
          <span className="text-[var(--danger)]">
            敲太快了，最高给您设置到{MAX_BPM}
          </span>
        )}
      </div>
    </div>
  )
}
