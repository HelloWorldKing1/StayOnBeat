import { useState } from 'react'
import { MetronomeDisplay } from './components/MetronomeDisplay'
import { PatternSettings } from './components/PatternSettings'
import { SettingsDrawer } from './components/SettingsDrawer'
import { TapTempo } from './components/TapTempo'
import { TempoControls } from './components/TempoControls'
import { TopBar } from './components/TopBar'
import { TransportControls } from './components/TransportControls'
import { useBeatPulse } from './hooks/useBeatPulse'
import { useMetronomeStore } from './store/useMetronomeStore'

function App() {
  useBeatPulse()
  const muted = useMetronomeStore((s) => s.muted)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-[var(--bg)] text-[var(--text-primary)]">
      {muted && (
        <div
          aria-hidden
          className="screen-glow pointer-events-none fixed inset-0 z-0"
        />
      )}
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-10">
        <h1 className="sr-only">StayOnBeat 在线节奏训练器</h1>
        <MetronomeDisplay />
        <TransportControls />
        <TempoControls />
        <TapTempo />
        <PatternSettings />
      </section>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}

export default App
