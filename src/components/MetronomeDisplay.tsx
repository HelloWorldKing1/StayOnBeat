import { secondsPerSubdivision, tempoMarking } from '../lib/tempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

export function MetronomeDisplay() {
  const bpm = useMetronomeStore((s) => s.bpm)
  const beatsPerBar = useMetronomeStore((s) => s.beatsPerBar)
  const subdivision = useMetronomeStore((s) => s.subdivision)
  const currentBeat = useMetronomeStore((s) => s.currentBeat)
  const currentSubdivision = useMetronomeStore((s) => s.currentSubdivision)
  const muted = useMetronomeStore((s) => s.muted)
  const mark = tempoMarking(bpm)
  const subMs = secondsPerSubdivision(bpm, subdivision) * 1000

  return (
    <section
      className="text-center"
      aria-label="节拍器显示"
      data-muted={muted}
      data-current-sub={currentSubdivision}
    >
      <p className="text-5xl font-bold tabular-nums">{bpm}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {mark.en} · {mark.zh}
        {muted && (
          <span className="ml-2 rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">
            仅视觉
          </span>
        )}
      </p>
      <div
        className="mt-5 flex items-center justify-center gap-3"
        role="group"
        aria-label="节拍灯"
      >
        {Array.from({ length: beatsPerBar }, (_, i) => {
          const active = i === currentBeat
          const accent = i === 0
          return (
            <span
              key={i}
              data-testid="beat-light"
              data-index={i}
              data-active={active}
              data-accent={accent}
              aria-current={active ? 'true' : undefined}
              className={`rounded-full transition-colors ${
                active
                  ? 'beat-pulse bg-[var(--primary)]'
                  : accent
                    ? 'bg-[var(--primary-soft)]'
                    : 'bg-[var(--text-secondary-soft)]'
              } ${accent ? 'h-5 w-5' : 'h-4 w-4'}`}
              style={active ? { animationDuration: `${subMs}ms` } : undefined}
            />
          )
        })}
      </div>
    </section>
  )
}
