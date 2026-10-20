import { useState } from 'react'
import { INITIAL_SCREEN, type Screen } from './appState.ts'
import HomeScreen from '../features/home/HomeScreen.tsx'

export default function App() {
  const [screen] = useState<Screen>(INITIAL_SCREEN)

  // The action screen is added in Milestone 2; until then Enter does not navigate.
  if (screen === 'home') {
    return <HomeScreen onEnter={() => {}} />
  }

  return null
}
