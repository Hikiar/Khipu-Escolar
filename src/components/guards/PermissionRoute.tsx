import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { PermissionCode } from '@/types/rbac'
import { ForbiddenPage } from '@/features/auth/pages/ForbiddenPage'
import { SessionLoading } from '@/components/guards/ProtectedRoute'

interface PermissionRouteProps {
  /** Permiso requerido para acceder (formato `modulo.accion`). */
  permission: PermissionCode
  children: ReactNode
}

/**
 * Guard de autorización: exige sesión Y permiso. Si el usuario autenticado no
 * tiene el permiso muestra 403 (nunca redirige a login para no filtrar rutas).
 */
export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const { estado, usuario, can } = useAuth()
  const location = useLocation()

  if (estado === 'restaurando') return <SessionLoading />
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!can(permission)) return <ForbiddenPage />
  return children
}