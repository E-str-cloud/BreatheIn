import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Heebo is bundled locally so the app has no runtime dependency on external font services.
import '@fontsource/heebo/400.css'
import '@fontsource/heebo/600.css'
import '@fontsource/heebo/700.css'
import './styles/tokens.css'
import './styles/global.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
