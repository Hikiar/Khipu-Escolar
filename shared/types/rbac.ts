/**
 * Modelo de dominio RBAC (contrato compartido frontend/API).
 *
 * Relación conceptual:
 *   Persona (1) → (N) Usuario/Cuenta → (N) Rol ⇄ (N-M) Permiso  vía RolPermiso
 *
 * Nota: `PermissionCode` es `string` a propósito. El catálogo tipado vive en
 * `shared/permissions.ts` y permite autocompletar, pero la lista NO está
 * cerrada: en una fase futura podrán crearse módulos y permisos personalizados.
 */
export type PermissionCode = string

/**
 * Código global que representa "todos los permisos". Se interpreta de forma
 * centralizada en `shared/authorization.ts`, nunca comparando nombres de rol.
 */
export const PERMISO_TOTAL = '*'

/**
 * Identificador de rol. Los roles son DATOS configurables (plantillas), no un
 * tipo cerrado: el Director podrá crear/editar/desactivar roles más adelante.
 */
export type RolId = string

export interface Persona {
  id: string
  dni: string
  /**
   * Código institucional [LETRA][AÑO 2D][CORRELATIVO 6D]. Obligatorio y permanente:
   * identifica a la persona en la institución y es la credencial de login (username).
   */
  codigoInstitucional: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
}

export interface Usuario {
  id: string
  personaId: string
  /** Código institucional de la persona: única credencial de acceso (username). */
  username: string
  activo: boolean
  /** El usuario debe cambiar su contraseña en el próximo ingreso (alta/reset/restablecimiento). */
  debeCambiarPassword: boolean
  rolIds: RolId[]
  /**
   * Permisos adicionales individuales por usuario.
   * PREPARADO para una fase futura: aún no hay UI ni servicios que lo usen.
   * Al autenticar se combinan con los permisos de sus roles.
   */
  permisosAdicionales?: PermissionCode[]
  createdAt: string
  desactivadoAt?: string
}

export interface Permiso {
  id: string
  codigo: PermissionCode
  modulo: string
  descripcion: string
}

export interface Rol {
  id: RolId
  codigo: string
  nombre: string
  descripcion: string
  activo: boolean
  /** Permisos otorgados por este rol. */
  permisos: PermissionCode[]
}

/** Entidad de relación N-M entre Rol y Permiso (modelo relacional). */
export interface RolPermiso {
  rolId: RolId
  permisoId: string
}