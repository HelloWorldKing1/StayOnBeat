import { useTrainingStore } from '../store/useTrainingStore'

const JUDGEMENT_LABELS = {
  perfect: 'Perfect',
  great: 'Great',
  good: 'Good',
  miss: 'Miss',
}
const JUDGEMENT_COLORS = {
  perfect: 'text-[#FFD166]',
  great: 'text-[#50C391]',
  good: 'text-[#E9AB3B]',
  miss: 'text-[#E45756]',
}

export function JudgementOverlay() {
  const lastJudgement = useTrainingStore((s) => s.lastJudgement)
  const resolvedCount = useTrainingStore((s) => s.session?.resolvedCount ?? 0)
  if (!lastJudgement) return null

  return (
    <p
      key={resolvedCount}
      data-testid="judgement"
      className={`text-2xl font-bold ${JUDGEMENT_COLORS[lastJudgement]}`}
    >
      {JUDGEMENT_LABELS[lastJudgement]}
    </p>
  )
}
