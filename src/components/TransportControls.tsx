import { useMetronomeStore } from '../store/useMetronomeStore'

export function TransportControls() {
  const isPlaying = useMetronomeStore((s) => s.isPlaying)
  const start = useMetronomeStore((s) => s.start)
  const stop = useMetronomeStore((s) => s.stop)

  return isPlaying ? (
    <button
      type="button"
      onClick={stop}
      className="rounded-full bg-[#E45756] px-8 py-3 font-semibold text-white"
    >
      停止
    </button>
  ) : (
    <button
      type="button"
      onClick={() => void start()}
      className="rounded-full bg-[#EB825A] px-8 py-3 font-semibold text-white"
    >
      开始
    </button>
  )
}
