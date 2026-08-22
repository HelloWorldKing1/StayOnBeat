import { MAX_BPM, MIN_BPM } from '../lib/tempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

export function TempoControls() {
  const bpm = useMetronomeStore((s) => s.bpm)
  const setBpm = useMetronomeStore((s) => s.setBpm)

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="降低 BPM"
        disabled={bpm <= MIN_BPM}
        onClick={() => setBpm(bpm - 1)}
        className="h-9 w-9 rounded-full border border-[var(--border)] disabled:opacity-40"
      >
        −
      </button>
      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        value={bpm}
        aria-label="BPM"
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-44"
      />
      <button
        type="button"
        aria-label="提高 BPM"
        disabled={bpm >= MAX_BPM}
        onClick={() => setBpm(bpm + 1)}
        className="h-9 w-9 rounded-full border border-[var(--border)] disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
