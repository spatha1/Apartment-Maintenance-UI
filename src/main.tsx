import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Fire-and-forget warmup so the serverless backend is awake before the user submits credentials
const _apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
fetch(`${_apiBase}/ping`).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
