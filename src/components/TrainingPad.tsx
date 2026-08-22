import { useRef } from 'react'
import { useTrainingInput } from '../hooks/useTrainingInput'

interface TrainingPadProps {
  onHit: (perfMs: number) => void
  active: boolean
}

export function TrainingPad({ onHit, active }: TrainingPadProps) {
  const ref = useRef<HTMLButtonElement>(null)
  useTrainingInput({ onHit, enabled: active, padRef: ref })

  return (
    <button
      ref={ref}
      type="button"
      data-training-pad
      aria-label="训练点击垫"
      disabled={!active}
      className={`h-40 w-64 rounded-3xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text-secondary)] transition-transform active:scale-95 ${
        active ? 'cursor-pointer' : 'opacity-60'
      }`}
    >
      {active ? '点击此处 / Space' : '准备…'}
    </button>
  )
}
