import PrimaryButton from '../../components/PrimaryButton.tsx'
import './HomeScreen.css'

type HomeScreenProps = {
  onEnter: () => void
}

export default function HomeScreen({ onEnter }: HomeScreenProps) {
  return (
    <main className="home-screen">
      {/* Decorative pastel rings in the corners, as in the mockup. */}
      <div className="home-screen__rings home-screen__rings--top" aria-hidden="true" />
      <div className="home-screen__rings home-screen__rings--bottom" aria-hidden="true" />

      <div className="home-screen__content">
        <h1 className="home-screen__title">נשום פנימה</h1>
        <PrimaryButton onClick={onEnter} dir="ltr">
          Enter
        </PrimaryButton>
      </div>
    </main>
  )
}
