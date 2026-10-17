import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { LoaderCircle } from 'lucide-react'

export function SessionLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-dvh flex-col items-center justify-center gap-3"
    >
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground">Verificando sesión…</span>
    </div>
  )
}

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Requiere sesión autenticada. Si no la hay redirige al login recordando la
 * ruta de origen (para regresar tras autenticarse).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { estado, usuario } = useAuth()
  const location = useLocation()

  if (estado === 'restaurando') return <SessionLoading />
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}