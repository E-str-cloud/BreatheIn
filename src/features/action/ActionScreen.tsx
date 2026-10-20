import PrimaryButton from '../../components/PrimaryButton.tsx'
import IconButton from '../../components/IconButton.tsx'
import { MutedSpeakerIcon, PlayIcon } from '../../components/icons.tsx'
import type { AudioController } from './audioController.ts'
import { useAudioStatus } from './useAudioStatus.ts'
import './ActionScreen.css'

type ActionScreenProps = {
  audio: AudioController
}

export default function ActionScreen({ audio }: ActionScreenProps) {
  const status = useAudioStatus(audio)
  const showRetry = status === 'blocked' || status === 'error'

  // Start and the Play circle share this exact handler.
  const handleStart = () => audio.playRandomSound()

  return (
    <main className="action-screen">
      <div className="action-screen__content">
        <div className="action-screen__rings">
          {/* The rings and the Play circle's white disc rotate; the button and its icon stay still. */}
          <div className="action-screen__orbit" aria-hidden="true">
            <div className="action-screen__ring action-screen__ring--1" />
            <div className="action-screen__ring action-screen__ring--2" />
            <div className="action-screen__ring action-screen__ring--3" />
            <div className="action-screen__ring action-screen__ring--4" />
            <div className="action-screen__ring action-screen__ring--5" />
          </div>
          <button type="button" className="action-screen__play" aria-label="Start" onClick={handleStart}>
            <span className="action-screen__play-disc" aria-hidden="true" />
            <PlayIcon />
          </button>
        </div>

        {/* The slot keeps its height when hidden so Start does not jump. */}
        <div className="action-screen__retry-slot">
          {showRetry && (
            <IconButton aria-label="הפעלת קול" onClick={() => audio.retryLastSound()}>
              <MutedSpeakerIcon />
            </IconButton>
          )}
        </div>

        <PrimaryButton onClick={handleStart} dir="ltr">
          Start
        </PrimaryButton>
      </div>
    </main>
  )
}
