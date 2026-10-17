import type { LucideIcon } from 'lucide-react'
import type { PermissionCode } from '@/types/rbac'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  /** Permiso necesario para ver el ítem (ausente = visible para cualquier sesión). */
  permission?: PermissionCode
  /** Restricción de presentación: solo visible para estos roles (no es autorización). */
  roles?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}