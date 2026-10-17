import { useMemo } from 'react'
import { navigationGroups } from '@/config/navigation'
import type { NavGroup, NavItem } from '@/types/navigation'
import { hasPermission } from '@/lib/authorization'
import { obtenerPermiso } from '@/config/permissions'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PERMISO_TOTAL, type PermissionCode } from '@/types/rbac'

/**
 * Predicado ÚNICO de visibilidad de un ítem de navegación: requiere el permiso
 * declarado (si lo hay) y, si el ítem restringe roles, al menos uno de los
 * roles del usuario. Es la fuente de verdad compartida por la barra lateral y
 * la explicación de módulos ocultos (evita la divergencia hallazgo C3).
 */
export function esItemVisible(
  item: NavItem,
  permisos: PermissionCode[],
  rolIds: string[],
): boolean {
  const cumplePermiso = hasPermission(permisos, item.permission)
  const cumpleRol = !item.roles || item.roles.some((rol) => rolIds.includes(rol))
  return cumplePermiso && cumpleRol
}

/** Motivo legible por el que un ítem NO es visible (permiso o rol). */
function explicarMotivo(item: NavItem, permisos: PermissionCode[]): string {
  if (item.permission && !hasPermission(permisos, item.permission)) {
    // Caso especial: el permiso total ('*') no está en el catálogo legible.
    if (item.permission === PERMISO_TOTAL) {
      return 'Requiere acceso total al sistema (solo dirección).'
    }
    const permiso = obtenerPermiso(item.permission)
    return permiso
      ? `Requiere el permiso «${permiso.descripcion}» (${permiso.codigo}).`
      : `Requiere el permiso «${item.permission}».`
  }
  return `Disponible solo para: ${item.roles?.join(', ') ?? 'roles específicos'}.`
}

export interface ModuloOculto {
  group: string
  item: NavItem
  motivo: string
}

/**
 * Navegación ya filtrada por los permisos del usuario actual.
 * Los grupos que quedan vacíos se omiten.
 */
export function useFilteredNav(): NavGroup[] {
  const { usuario } = useAuth()

  return useMemo(() => {
    const permisos = usuario?.permisos ?? []
    const rolIds = usuario?.rolIds ?? []
    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => esItemVisible(item, permisos, rolIds)),
      }))
      .filter((group) => group.items.length > 0)
  }, [usuario])
}

/**
 * Módulos de navegación que NO aparecen en el menú para el usuario actual,
 * con el motivo concreto (permiso requerido o roles). Usa el mismo predicado
 * que `useFilteredNav` para que la explicación nunca contradiga al menú.
 */
export function useModulosOcultos(): ModuloOculto[] {
  const { usuario } = useAuth()

  return useMemo(() => {
    const permisos = usuario?.permisos ?? []
    const rolIds = usuario?.rolIds ?? []
    const ocultos: ModuloOculto[] = []
    for (const group of navigationGroups) {
      for (const item of group.items) {
        if (esItemVisible(item, permisos, rolIds)) continue
        ocultos.push({ group: group.label, item, motivo: explicarMotivo(item, permisos) })
      }
    }
    return ocultos
  }, [usuario])
}
