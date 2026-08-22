export const INPUT_DEDUPE_WINDOW_MS = 50

/**
 * 归一化事件时间到 performance-relative（毫秒）。
 * 现代浏览器 `event.timeStamp` 与 `performance.now()` 同源（数值较小）；
 * 若时间戳近似 epoch（>1e12），换算为 performance-relative。
 */
export function normalizeEventTimeMs(
  timeStamp: number,
  nowPerfMs = performance.now(),
): number {
  if (timeStamp > 1e12) {
    return timeStamp - (Date.now() - nowPerfMs)
  }
  return timeStamp
}

/** 是否在去重窗口内（判定为同一物理动作的二次事件）。 */
export function shouldDedupe(
  prevMs: number | null,
  nowMs: number,
  windowMs = INPUT_DEDUPE_WINDOW_MS,
): boolean {
  return prevMs != null && nowMs - prevMs < windowMs
}
