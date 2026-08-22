import { useState } from 'react'
import {
  MAX_BEATS_PER_BAR,
  MIN_BEATS_PER_BAR,
  SUBDIVISIONS,
  subdivisionLabel,
  type SubdivisionFactor,
} from '../lib/tempo'
import { useMetronomeStore } from '../store/useMetronomeStore'

const TIMER_PRESETS = [15, 30, 60, 120] as const
const TIMER_MODE_INFINITE = 'infinite'
const TIMER_MODE_CUSTOM = 'custom'

function initialTimerMode(timerSeconds: number | null): string {
  if (timerSeconds === null) return TIMER_MODE_INFINITE
  return (TIMER_PRESETS as readonly number[]).includes(timerSeconds)
    ? String(timerSeconds)
    : TIMER_MODE_CUSTOM
}

interface PatternSettingsProps {
  disabled?: boolean
}

export function PatternSettings({ disabled = false }: PatternSettingsProps) {
  const beatsPerBar = useMetronomeStore((s) => s.beatsPerBar)
  const accentFirstBeat = useMetronomeStore((s) => s.accentFirstBeat)
  const subdivision = useMetronomeStore((s) => s.subdivision)
  const timerSeconds = useMetronomeStore((s) => s.timerSeconds)
  const setBeatsPerBar = useMetronomeStore((s) => s.setBeatsPerBar)
  const setAccentFirstBeat = useMetronomeStore((s) => s.setAccentFirstBeat)
  const setSubdivision = useMetronomeStore((s) => s.setSubdivision)
  const setTimerSeconds = useMetronomeStore((s) => s.setTimerSeconds)

  const [timerMode, setTimerMode] = useState(() => initialTimerMode(timerSeconds))
  const [customTimer, setCustomTimer] = useState(60)

  const handleTimerMode = (mode: string) => {
    setTimerMode(mode)
    if (mode === TIMER_MODE_INFINITE) setTimerSeconds(null)
    else if (mode === TIMER_MODE_CUSTOM) setTimerSeconds(customTimer)
    else setTimerSeconds(Number(mode))
  }

  const handleCustomChange = (value: string) => {
    const v = Number(value)
    if (!Number.isFinite(v)) return
    const clamped = Math.max(1, Math.min(3600, v))
    setCustomTimer(clamped)
    setTimerSeconds(clamped)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
      <label className="flex items-center gap-2">
        <span>每小节</span>
        <select
          aria-label="每小节拍数"
          value={beatsPerBar}
          disabled={disabled}
          onChange={(e) => setBeatsPerBar(Number(e.target.value))}
          className="rounded border border-[var(--border)] bg-transparent px-2 py-1 disabled:opacity-40"
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

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          aria-label="重音"
          checked={accentFirstBeat}
          disabled={disabled}
          onChange={(e) => setAccentFirstBeat(e.target.checked)}
        />
        <span>重音</span>
      </label>

      <label className="flex items-center gap-2">
        <span>细分</span>
        <select
          aria-label="细分"
          value={subdivision}
          disabled={disabled}
          onChange={(e) => setSubdivision(Number(e.target.value) as SubdivisionFactor)}
          className="rounded border border-[var(--border)] bg-transparent px-2 py-1 disabled:opacity-40"
        >
          {SUBDIVISIONS.map((s) => (
            <option key={s} value={s} className="text-black">
              {subdivisionLabel(s).zh}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span>计时</span>
        <select
          aria-label="计时器"
          value={timerMode}
          disabled={disabled}
          onChange={(e) => handleTimerMode(e.target.value)}
          className="rounded border border-[var(--border)] bg-transparent px-2 py-1 disabled:opacity-40"
        >
          <option value={TIMER_MODE_INFINITE} className="text-black">
            无限
          </option>
          {TIMER_PRESETS.map((t) => (
            <option key={t} value={t} className="text-black">
              {t}s
            </option>
          ))}
          <option value={TIMER_MODE_CUSTOM} className="text-black">
            自定义
          </option>
        </select>
        {timerMode === TIMER_MODE_CUSTOM && (
          <input
            type="number"
            min={1}
            max={3600}
            value={timerSeconds ?? customTimer}
            aria-label="自定义计时秒数"
            disabled={disabled}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-20 rounded border border-[var(--border)] bg-transparent px-2 py-1 disabled:opacity-40"
          />
        )}
      </label>
    </div>
  )
}
