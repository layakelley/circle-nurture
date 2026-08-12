import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/base.css'
import App from './App.tsx'

// autoUpdate: the service worker takes over immediately (skipWaiting +
// clientsClaim, configured in vite.config.ts) and this just keeps the
// registration alive — no user-facing "update available" prompt needed
// for this greenfield shell.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
