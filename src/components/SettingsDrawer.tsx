import { useEffect } from 'react'
import { useMetronomeStore, type InputMode } from '../store/useMetronomeStore'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const volume = useMetronomeStore((s) => s.volume)
  const setVolume = useMetronomeStore((s) => s.setVolume)
  const muted = useMetronomeStore((s) => s.muted)
  const setMuted = useMetronomeStore((s) => s.setMuted)
  const theme = useMetronomeStore((s) => s.theme)
  const setTheme = useMetronomeStore((s) => s.setTheme)
  const inputMode = useMetronomeStore((s) => s.inputMode)
  const setInputMode = useMetronomeStore((s) => s.setInputMode)

  // M5.2：Escape 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="w-full max-w-md rounded-t-2xl border border-[var(--border)] bg-[var(--panel)] p-6"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">设置</h2>
          <button
            type="button"
            aria-label="关闭设置"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-3 py-1"
          >
            ×
          </button>
        </div>
        <label className="mb-4 flex items-center gap-3 text-sm">
          <span className="w-12">音量</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            aria-label="音量"
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
          <span className="tabular-nums">{Math.round(volume * 100)}%</span>
        </label>
        <label className="mb-4 flex items-center gap-3 text-sm">
          <span className="w-12">静音</span>
          <input
            type="checkbox"
            aria-label="静音"
            checked={muted}
            onChange={(e) => setMuted(e.target.checked)}
          />
        </label>
        <label className="mb-4 flex items-center gap-3 text-sm">
          <span className="w-12">输入</span>
          <select
            aria-label="输入方式"
            value={inputMode}
            onChange={(e) => setInputMode(e.target.value as InputMode)}
            className="rounded border border-[var(--border)] bg-transparent px-2 py-1"
          >
            <option value="keyboard" className="text-black">
              仅键盘
            </option>
            <option value="mouse" className="text-black">
              仅鼠标
            </option>
            <option value="mixed" className="text-black">
              混合
            </option>
          </select>
        </label>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-12">主题</span>
          <button
            type="button"
            aria-label="切换主题"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded border border-[var(--border)] px-3 py-1"
          >
            {theme === 'dark' ? '暗色' : '亮色'}
          </button>
        </div>
      </section>
    </div>
  )
}
