import { BeatSettings } from './components/BeatSettings'
import { MetronomeDisplay } from './components/MetronomeDisplay'
import { TempoControls } from './components/TempoControls'
import { TransportControls } from './components/TransportControls'
import { useBeatPulse } from './hooks/useBeatPulse'

function App() {
  useBeatPulse()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#21232F] px-6 text-white">
      <h1 className="sr-only">StayOnBeat 在线节奏训练器</h1>
      <MetronomeDisplay />
      <TransportControls />
      <TempoControls />
      <BeatSettings />
    </main>
  )
}

export default App
