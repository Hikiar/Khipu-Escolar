import { PERMISO_TOTAL, type PermissionCode, type Rol } from './types/rbac.ts'

/**
 * Autorización centralizada (funciones puras, sin dependencias de React).
 * Contrato compartido frontend/API.
 *
 * Regla de oro: el acceso SIEMPRE se decide por permisos, nunca comparando
 * nombres de rol. Todo chequeo de rol debe pasar por `tieneRol` y usarse solo
 * como auxiliar (p. ej. etiquetas de UI), no para bloquear rutas/acciones.
 */

/** Un permiso concedido cubre el requerido si: es el total, es exacto o es un wildcard de módulo. */
export function hasPermission(
  permisos: PermissionCode[],
  requerido?: PermissionCode,
): boolean {
  if (!requerido) return true
  if (permisos.includes(PERMISO_TOTAL)) return true

  const [moduloRequerido, accionRequerida] = requerido.split('.')

  return permisos.some((concedido) => {
    if (concedido === requerido) return true

    // wildcard de módulo: "alumnos.*" cubre "alumnos.ver", "alumnos.crear", ...
    if (concedido.endsWith('.*')) {
      const [modulo, accion] = concedido.split('.')
      return modulo === moduloRequerido && accion === '*'
    }

    // wildcard genérico dentro del mismo módulo
    if (
      accionRequerida === '*' &&
      concedido.split('.')[0] === moduloRequerido
    ) {
      return true
    }

    return false
  })
}

/** Chequeo centralizado de rol. No debe usarse para autorizar acceso. */
export function hasRoleUnico(
  rolIds: string[],
  rolId: string,
): boolean {
  return rolIds.includes(rolId)
}

/** Permisos finales de un usuario = unión de los permisos de sus roles activos. */
export function obtenerPermisosDeRoles(roles: Rol[]): PermissionCode[] {
  const permisos = new Set<PermissionCode>()
  for (const rol of roles) {
    if (!rol.activo) continue
    for (const permiso of rol.permisos) permisos.add(permiso)
  }
  return [...permisos]
}

/**
 * Permisos finales combinando roles y permisos adicionales individuales.
 * `permisosAdicionales` QUEDA LISTO para una fase futura (aún sin UI/servicio).
 */
export function resolverPermisosDeUsuario(
  roles: Rol[],
  permisosAdicionales: PermissionCode[] = [],
): PermissionCode[] {
  const base = obtenerPermisosDeRoles(roles)
  const set = new Set<PermissionCode>([...base, ...permisosAdicionales])
  return [...set]
}

/** Filtra ítems (p. ej. navegación) según el permiso que cada uno requiere. */
export function filtrarItemsAutorizados<T extends { permission?: PermissionCode }>(
  items: T[],
  permisos: PermissionCode[],
): T[] {
  return items.filter((item) => hasPermission(permisos, item.permission))
}