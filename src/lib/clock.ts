/** 参与校准的最小上下文结构，便于测试注入假 AudioContext。 */
export interface ClockContext {
  currentTime: number
}

export interface AudioClockBridge {
  calibrate(ctx: ClockContext): void
  /** 音频时间（秒）→ 性能时间（毫秒）。 */
  audioToPerfMs(audioTime: number): number
  /** 性能时间（毫秒）→ 音频时间（秒）。 */
  perfMsToAudio(perfMs: number): number
}

export function createClockBridge(): AudioClockBridge {
  let audioEpoch = 0
  let perfEpoch = 0

  return {
    calibrate(ctx) {
      // 统一用输入时钟（ctx.currentTime）校准，与调度/视觉同源。
      // 不使用 getOutputTimestamp()：其 performanceTime 跨浏览器时间基不一致会引入大偏移，
      // 曾导致训练输入（perfMsToAudio）无法命中预期拍。
      audioEpoch = ctx.currentTime
      perfEpoch = performance.now()
    },
    audioToPerfMs(audioTime) {
      return perfEpoch + (audioTime - audioEpoch) * 1000
    },
    perfMsToAudio(perfMs) {
      return audioEpoch + (perfMs - perfEpoch) / 1000
    },
  }
}

/** 应用单例。M1.4 调度启动时校准，M3 输入评分复用（统一输入时钟）。 */
export const audioClockBridge: AudioClockBridge = createClockBridge()
