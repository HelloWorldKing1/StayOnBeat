import { useEffect } from 'react'
import { metronomeEngine, useMetronomeStore } from '../store/useMetronomeStore'
import { useTrainingStore, type TrainingPhase } from '../store/useTrainingStore'

/** 拍灯 rAF 是否应运行：节拍器 isPlaying 或训练进行中（countIn/training）。 */
export function shouldRunBeatPulse(isPlaying: boolean, phase: TrainingPhase): boolean {
  return isPlaying || phase === 'countIn' || phase === 'training'
}

/**
 * 播放期间用 rAF 驱动 currentBeat：
 * 每帧读调度同源的音频时钟（ctx.currentTime），再询问调度引擎当前拍序号，写入 store。
 * 节拍器模式由 isPlaying 驱动；训练模式由 training phase 驱动（startTraining 不置 isPlaying）。
 * 停止或卸载时取消 rAF（StrictMode 双挂载安全）。
 */
export function useBeatPulse(): void {
  const isPlaying = useMetronomeStore((s) => s.isPlaying)
  const phase = useTrainingStore((s) => s.phase)
  const running = shouldRunBeatPulse(isPlaying, phase)

  useEffect(() => {
    if (!running) return
    let rafId = 0

    const loop = () => {
      const audioNow = metronomeEngine.currentAudioTime()
      const beat = metronomeEngine.beatIndexAtAudioTime(audioNow)
      const sub = metronomeEngine.subdivisionIndexAtAudioTime(audioNow)
      useMetronomeStore.getState()._setCurrentBeat(beat)
      useMetronomeStore.getState()._setCurrentSubdivision(sub)
      rafId = requestAnimationFrame(loop)
    }

    // 后台切回：节拍器模式重校准重排；训练模式中止（aborted）且跳过 resumeAfterBackground
    const onVisibilityChange = () => {
      const { mode } = useMetronomeStore.getState()
      if (document.visibilityState === 'hidden') {
        if (mode === 'training') {
          useTrainingStore.getState().stopTraining('aborted')
          useMetronomeStore.getState().stop()
        }
      } else if (document.visibilityState === 'visible' && mode === 'metronome') {
        metronomeEngine.resumeAfterBackground()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    rafId = requestAnimationFrame(loop)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      cancelAnimationFrame(rafId)
    }
  }, [running])
}
