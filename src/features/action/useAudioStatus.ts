import { useSyncExternalStore } from 'react'
import type { AudioController, AudioStatus } from './audioController.ts'

export function useAudioStatus(controller: AudioController): AudioStatus {
  return useSyncExternalStore(controller.subscribe, controller.getStatus)
}
