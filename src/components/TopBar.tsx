import { useFullscreen } from '../hooks/useFullscreen'
import { useMetronomeStore } from '../store/useMetronomeStore'
import { useTrainingStore } from '../store/useTrainingStore'

interface TopBarProps {
  onOpenSettings: () => void
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  const theme = useMetronomeStore((s) => s.theme)
  const setTheme = useMetronomeStore((s) => s.setTheme)
  const muted = useMetronomeStore((s) => s.muted)
  const setMuted = useMetronomeStore((s) => s.setMuted)
  const mode = useMetronomeStore((s) => s.mode)
  const setMode = useMetronomeStore((s) => s.setMode)
  const { isFullscreen, toggle, supported } = useFullscreen()

  // 切换模式前先停止当前 transport，避免会话错乱（节拍器停止 / 训练中止）
  const handleModeSwitch = () => {
    const { mode: current, isPlaying } = useMetronomeStore.getState()
    if (current === 'training') {
      const phase = useTrainingStore.getState().phase
      if (phase === 'countIn' || phase === 'training') {
        useTrainingStore.getState().stopTraining('aborted')
        useMetronomeStore.getState().stop()
      }
    } else if (isPlaying) {
      useMetronomeStore.getState().stop()
    }
    setMode(current === 'training' ? 'metronome' : 'training')
  }

  return (
    <header className="relative z-10 flex w-full flex-wrap items-center justify-between gap-y-2 px-6 py-3">
      <span className="text-sm font-semibold tracking-[0.28em] text-[var(--primary)]">
        STAY ON BEAT
      </span>
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        <button
          type="button"
          aria-label={mode === 'training' ? '切换节拍器' : '切换训练模式'}
          onClick={handleModeSwitch}
          className="rounded-full border border-[var(--border)] px-3 py-1"
        >
          {mode === 'training' ? '切换节拍器' : '切换训练模式'}
        </button>
        <button
          type="button"
          aria-label="切换主题"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full border border-[var(--border)] px-3 py-1"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <button
          type="button"
          aria-label={muted ? '开启声音' : '静音'}
          onClick={() => setMuted(!muted)}
          className="rounded-full border border-[var(--border)] px-3 py-1"
        >
          {muted ? '🔇' : '🔊'}
        </button>
        {supported && (
          <button
            type="button"
            aria-label="全屏"
            onClick={toggle}
            className="rounded-full border border-[var(--border)] px-3 py-1"
          >
            {isFullscreen ? '还原' : '全屏'}
          </button>
        )}
        <button
          type="button"
          aria-label="设置"
          onClick={onOpenSettings}
          className="rounded-full border border-[var(--border)] px-3 py-1"
        >
          设置
        </button>
      </div>
    </header>
  )
}
