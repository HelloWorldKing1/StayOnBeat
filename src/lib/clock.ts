export interface AudioTimestamp {
  contextTime: number
  performanceTime: number
}

/** 参与校准的最小上下文结构，便于测试注入假 AudioContext。 */
export interface ClockContext {
  currentTime: number
  getOutputTimestamp?: () => Partial<AudioTimestamp> | null
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
      audioEpoch = ctx.currentTime
      perfEpoch = performance.now()
      // 若浏览器提供输出时间戳（含实际输出延迟），优先用它校准
      const ts = ctx.getOutputTimestamp?.()
      if (
        ts &&
        typeof ts.contextTime === 'number' &&
        typeof ts.performanceTime === 'number'
      ) {
        audioEpoch = ts.contextTime
        perfEpoch = ts.performanceTime
      }
    },
    audioToPerfMs(audioTime) {
      return perfEpoch + (audioTime - audioEpoch) * 1000
    },
    perfMsToAudio(perfMs) {
      return audioEpoch + (perfMs - perfEpoch) / 1000
    },
  }
}

/** 应用单例。M1.4 调度启动时校准，M1.6 视觉 rAF 读取、M3 输入评分复用。 */
export const audioClockBridge: AudioClockBridge = createClockBridge()
