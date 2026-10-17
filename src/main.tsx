import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)