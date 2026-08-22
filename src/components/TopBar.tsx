import { useFullscreen } from '../hooks/useFullscreen'
import { useMetronomeStore } from '../store/useMetronomeStore'

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

  return (
    <header className="relative z-10 flex w-full items-center justify-between px-6 py-3">
      <span className="text-sm font-semibold tracking-[0.28em] text-[var(--primary)]">
        STAY ON BEAT
      </span>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          aria-label="切换模式"
          onClick={() => setMode(mode === 'training' ? 'metronome' : 'training')}
          className="rounded-full border border-[var(--border)] px-3 py-1"
        >
          {mode === 'training' ? '训练' : '节拍器'}
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
