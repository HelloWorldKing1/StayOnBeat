import { useEffect } from 'react'
import { metronomeEngine, useMetronomeStore } from '../store/useMetronomeStore'

/**
 * 播放期间用 rAF 驱动 currentBeat：
 * 每帧读调度同源的音频时钟（ctx.currentTime），再询问调度引擎当前拍序号，写入 store。
 * 停止或卸载时取消 rAF（StrictMode 双挂载安全）。
 */
export function useBeatPulse(): void {
  const isPlaying = useMetronomeStore((s) => s.isPlaying)

  useEffect(() => {
    if (!isPlaying) return
    let rafId = 0

    const loop = () => {
      const audioNow = metronomeEngine.currentAudioTime()
      const beat = metronomeEngine.beatIndexAtAudioTime(audioNow)
      useMetronomeStore.getState()._setCurrentBeat(beat)
      rafId = requestAnimationFrame(loop)
    }

    // 后台标签页定时器被节流会耗尽调度窗口，回前台时重校准并重排
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        metronomeEngine.resumeAfterBackground()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    rafId = requestAnimationFrame(loop)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      cancelAnimationFrame(rafId)
    }
  }, [isPlaying])
}
