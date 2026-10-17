import { useAuth } from '@/features/auth/hooks/useAuth'
import type { PermissionCode } from '@/types/rbac'

interface CanProps {
  permission?: PermissionCode
  children: React.ReactNode
  /** Contenido alternativo cuando no se tiene el permiso. */
  fallback?: React.ReactNode
}

/**
 * Render condicional de UI según permiso. No sustituye a los guards de ruta ni
 * a la validación en servicios; es solo una capa de presentación.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = useAuth()
  return can(permission) ? children : fallback
}