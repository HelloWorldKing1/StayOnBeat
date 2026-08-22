import { computeAccuracy } from '../lib/scoring'
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

export function ScoreHUD() {
  const session = useTrainingStore((s) => s.session)
  const lastJudgement = useTrainingStore((s) => s.lastJudgement)
  const lastOffsetMs = useTrainingStore((s) => s.lastOffsetMs)
  const accuracy = session
    ? computeAccuracy(session.totalScore, session.resolvedCount)
    : 0
  const combo = session?.combo ?? 0

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-4 text-sm"
      data-testid="score-hud"
    >
      <span>
        匹配度 <strong className="tabular-nums">{accuracy.toFixed(1)}%</strong>
      </span>
      <span>
        连击 <strong className="tabular-nums">{combo}</strong>
      </span>
      {lastJudgement && (
        <span data-testid="last-judgement" className={JUDGEMENT_COLORS[lastJudgement]}>
          {JUDGEMENT_LABELS[lastJudgement]}
          {lastOffsetMs != null && lastJudgement !== 'miss' && (
            <span className="ml-1 text-[var(--text-secondary)]">
              {lastOffsetMs < 0
                ? `${Math.round(-lastOffsetMs)}ms 早`
                : `${Math.round(lastOffsetMs)}ms 晚`}
            </span>
          )}
        </span>
      )}
    </div>
  )
}
