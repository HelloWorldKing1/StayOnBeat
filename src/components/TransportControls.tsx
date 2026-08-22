import { useMetronomeStore } from '../store/useMetronomeStore'
import { useTrainingStore } from '../store/useTrainingStore'

export function TransportControls() {
  const mode = useMetronomeStore((s) => s.mode)
  const isPlaying = useMetronomeStore((s) => s.isPlaying)
  const startMetronome = useMetronomeStore((s) => s.start)
  const stopMetronome = useMetronomeStore((s) => s.stop)
  const phase = useTrainingStore((s) => s.phase)
  const startTraining = useTrainingStore((s) => s.startTraining)
  const stopTraining = useTrainingStore((s) => s.stopTraining)

  const training = mode === 'training'
  const running = training ? phase === 'countIn' || phase === 'training' : isPlaying

  const handleStart = () => {
    if (training) void startTraining()
    else void startMetronome()
  }

  const handleStop = () => {
    stopMetronome()
    if (training) stopTraining('aborted')
  }

  return running ? (
    <button
      type="button"
      aria-label="停止"
      onClick={handleStop}
      className="rounded-full bg-[var(--danger)] px-8 py-3 font-semibold text-white"
    >
      停止
    </button>
  ) : (
    <button
      type="button"
      aria-label={training ? '开始训练' : '开始'}
      onClick={handleStart}
      className="rounded-full bg-[var(--primary)] px-8 py-3 font-semibold text-white"
    >
      {training ? '开始训练' : '开始'}
    </button>
  )
}
