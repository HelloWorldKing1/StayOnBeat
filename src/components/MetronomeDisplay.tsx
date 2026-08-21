import { tempoMarking } from '../lib/tempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

export function MetronomeDisplay() {
  const bpm = useMetronomeStore((s) => s.bpm)
  const beatsPerBar = useMetronomeStore((s) => s.beatsPerBar)
  const currentBeat = useMetronomeStore((s) => s.currentBeat)
  const mark = tempoMarking(bpm)

  return (
    <section className="text-center" aria-label="节拍器显示">
      <p className="text-5xl font-bold tabular-nums">{bpm}</p>
      <p className="mt-1 text-sm text-[#75798D]">
        {mark.en} · {mark.zh}
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
                active ? 'bg-[#EB825A]' : accent ? 'bg-[#EB825A]/40' : 'bg-[#75798D]/40'
              } ${accent ? 'h-5 w-5' : 'h-4 w-4'}`}
            />
          )
        })}
      </div>
    </section>
  )
}
