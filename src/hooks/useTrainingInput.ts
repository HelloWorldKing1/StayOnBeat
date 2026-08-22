import { useEffect, useRef, type RefObject } from 'react'
import {
  INPUT_DEDUPE_WINDOW_MS,
  normalizeEventTimeMs,
  shouldDedupe,
} from '../lib/input'

export interface UseTrainingInputOptions {
  onHit: (perfMs: number) => void
  enabled: boolean
  padRef: RefObject<HTMLElement | null>
}

/**
 * 训练输入采集：keydown（Space/Enter，preventDefault + 过滤 repeat）+ pointerdown（限定训练垫），
 * 统一去重（50ms 窗口）后以 performance-relative 时间回调 onHit。
 */
export function useTrainingInput({
  onHit,
  enabled,
  padRef,
}: UseTrainingInputOptions): void {
  // 用 ref 持有最新 onHit，避免父组件每次渲染新建回调导致监听重挂
  const onHitRef = useRef(onHit)
  useEffect(() => {
    onHitRef.current = onHit
  }, [onHit])

  useEffect(() => {
    if (!enabled) return
    let lastHitMs: number | null = null

    const fire = (rawMs: number) => {
      const t = normalizeEventTimeMs(rawMs)
      if (shouldDedupe(lastHitMs, t, INPUT_DEDUPE_WINDOW_MS)) return
      lastHitMs = t
      onHitRef.current(t)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        fire(performance.now())
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.target instanceof Element && padRef.current?.contains(e.target)) {
        fire(performance.now())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [enabled, padRef])
}
