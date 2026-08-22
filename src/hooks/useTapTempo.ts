import { useCallback, useRef, useState } from 'react'
import { estimateTapTempo, type TapTempoResult } from '../lib/tapTempo'

export const DEFAULT_TAP_MAX_GAP_MS = 2500

interface UseTapTempoOptions {
  minTaps?: number
  maxGapMs?: number
}

export interface TapTempoState {
  taps: number
  estimatedBpm: number | null
  /** 是否敲得过快（原始 BPM 超 240 或样本全被过滤）。 */
  tooFast: boolean
  onTap: () => void
  reset: () => void
}

/** 收集 Tap 时间戳估算 BPM；相邻间隔超过 maxGapMs 时重置序列。 */
export function useTapTempo(opts: UseTapTempoOptions = {}): TapTempoState {
  const { minTaps = 4, maxGapMs = DEFAULT_TAP_MAX_GAP_MS } = opts
  const timesRef = useRef<number[]>([])
  const [taps, setTaps] = useState(0)
  const [result, setResult] = useState<TapTempoResult>({ bpm: null, fast: false })

  const reset = useCallback(() => {
    timesRef.current = []
    setTaps(0)
    setResult({ bpm: null, fast: false })
  }, [])

  const onTap = useCallback(() => {
    const now = performance.now()
    const prev = timesRef.current[timesRef.current.length - 1]
    if (prev != null && now - prev > maxGapMs) {
      timesRef.current = []
    }
    timesRef.current.push(now)
    setTaps(timesRef.current.length)
    setResult(estimateTapTempo(timesRef.current, minTaps))
  }, [maxGapMs, minTaps])

  return { taps, estimatedBpm: result.bpm, tooFast: result.fast, onTap, reset }
}
