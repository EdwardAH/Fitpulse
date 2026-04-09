import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TrainerDashboard from './dashboard-entry.jsx'

createRoot(document.getElementById('dashboard-root')).render(
  <StrictMode>
    <TrainerDashboard />
  </StrictMode>
)
