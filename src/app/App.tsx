import { useState } from 'react'
import { INITIAL_SCREEN, type Screen } from './appState.ts'
import HomeScreen from '../features/home/HomeScreen.tsx'
import ActionScreen from '../features/action/ActionScreen.tsx'
import { createAudioController } from '../features/action/audioController.ts'

// Navigation is one-way: the home screen only appears when the app is (re)opened.
export default function App() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN)
  const [audio] = useState(() => createAudioController())

  // play() is called directly inside the click so browsers (notably iOS Safari) treat it as user-initiated.
  const handleEnter = () => {
    audio.playEntrySound()
    setScreen('action')
  }

  if (screen === 'action') {
    return <ActionScreen audio={audio} />
  }

  return <HomeScreen onEnter={handleEnter} />
}
