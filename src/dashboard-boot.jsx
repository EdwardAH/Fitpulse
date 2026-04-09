import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import TrainerDashboard from './dashboard-entry.jsx'

inject()

createRoot(document.getElementById('dashboard-root')).render(
  <StrictMode>
    <TrainerDashboard />
  </StrictMode>
)
