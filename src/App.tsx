import { useState } from 'react'
import { HistoryPanel } from './components/HistoryPanel'
import { JudgementOverlay } from './components/JudgementOverlay'
import { MetronomeDisplay } from './components/MetronomeDisplay'
import { PatternSettings } from './components/PatternSettings'
import { ScoreHUD } from './components/ScoreHUD'
import { SessionSummary } from './components/SessionSummary'
import { SettingsDrawer } from './components/SettingsDrawer'
import { TapTempo } from './components/TapTempo'
import { TempoControls } from './components/TempoControls'
import { TopBar } from './components/TopBar'
import { TrainingPad } from './components/TrainingPad'
import { TransportControls } from './components/TransportControls'
import { useBeatPulse } from './hooks/useBeatPulse'
import { useSaveSessionToHistory } from './hooks/useSaveSessionToHistory'
import { useMetronomeStore } from './store/useMetronomeStore'
import { useTrainingStore } from './store/useTrainingStore'

function App() {
  useBeatPulse()
  useSaveSessionToHistory()
  const muted = useMetronomeStore((s) => s.muted)
  const mode = useMetronomeStore((s) => s.mode)
  const phase = useTrainingStore((s) => s.phase)
  const recordHit = useTrainingStore((s) => s.recordHit)
  const resetTraining = useTrainingStore((s) => s.reset)
  const startTraining = useTrainingStore((s) => s.startTraining)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const training = mode === 'training'
  const locked = training && (phase === 'countIn' || phase === 'training')
  const summary = training && phase === 'summary'

  const handleRetry = () => {
    resetTraining()
    void startTraining()
  }
  const handleBack = () => {
    resetTraining()
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-[var(--bg)] text-[var(--text-primary)]">
      {muted && (
        <div
          aria-hidden
          className="screen-glow pointer-events-none fixed inset-0 z-0"
        />
      )}
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10">
        <h1 className="sr-only">StayOnBeat 在线节奏训练器</h1>
        <MetronomeDisplay />
        {training && !summary && (
          <div className="relative flex flex-col items-center gap-3">
            <TrainingPad
              onHit={(perfMs) => recordHit(perfMs)}
              active={phase === 'training'}
            />
            <JudgementOverlay />
          </div>
        )}
        {summary && <SessionSummary onRetry={handleRetry} onBack={handleBack} />}
        <TransportControls />
        {training && !summary && <ScoreHUD />}
        <TempoControls disabled={locked} />
        <TapTempo disabled={locked} />
        <PatternSettings disabled={locked} />
        {training && <HistoryPanel />}
      </section>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}

export default App
