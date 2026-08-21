import { MAX_BEATS_PER_BAR, MIN_BEATS_PER_BAR } from '../lib/tempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

export function BeatSettings() {
  const beatsPerBar = useMetronomeStore((s) => s.beatsPerBar)
  const accentFirstBeat = useMetronomeStore((s) => s.accentFirstBeat)
  const setBeatsPerBar = useMetronomeStore((s) => s.setBeatsPerBar)
  const setAccentFirstBeat = useMetronomeStore((s) => s.setAccentFirstBeat)

  return (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-sm">
        <span>每小节</span>
        <select
          aria-label="每小节拍数"
          value={beatsPerBar}
          onChange={(e) => setBeatsPerBar(Number(e.target.value))}
          className="rounded border border-white/20 bg-transparent px-2 py-1"
        >
          {Array.from({ length: MAX_BEATS_PER_BAR - MIN_BEATS_PER_BAR + 1 }, (_, i) => {
            const n = MIN_BEATS_PER_BAR + i
            return (
              <option key={n} value={n} className="text-black">
                {n}
              </option>
            )
          })}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          aria-label="重音"
          checked={accentFirstBeat}
          onChange={(e) => setAccentFirstBeat(e.target.checked)}
        />
        <span>重音</span>
      </label>
    </div>
  )
}
