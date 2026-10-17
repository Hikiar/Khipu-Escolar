import type { Persona, Rol, PermissionCode } from './rbac.ts'
import type { ResultadoServicio } from './operations.ts'

/**
 * Usuario enriquecido con su sesión y permisos aplanados resolvidos a partir
 * de sus roles (+ permisos adicionales individuales, cuando existan).
 */
export interface AuthUser {
  id: string
  username: string
  persona: Persona
  activo: boolean
  /** El usuario debe cambiar su contraseña en el próximo ingreso (alta/reset/restablecimiento). */
  debeCambiarPassword: boolean
  roles: Rol[]
  rolIds: RolIdResolved[]
  /** Permisos finales: unión de los permisos de sus roles activos. */
  permisos: PermissionCode[]
}

/** Alias de legibilidad; mantiene la relación con `Rol.id`. */
export type RolIdResolved = Rol['id']

export interface Sesion {
  token: string
  usuario: AuthUser
  createdAt: string
  /** Momento de expiración (ISO). Al vencer, la sesión se invalida. */
  expiresAt: string
}

export interface CredencialesLogin {
  /** Código institucional de la persona (username de la cuenta). */
  codigo: string
  password: string
}

export type CodigoErrorAuth =
  | 'INVALID_CREDENTIALS'
  | 'USER_INACTIVE'
  | 'SESSION_EXPIRED'
  | 'SERVER_ERROR'

export type ResultadoAutenticacionOk = { ok: true; sesion: Sesion }
export type ResultadoAutenticacionError = { ok: false; error: CodigoErrorAuth }

export type ResultadoAutenticacion =
  | ResultadoAutenticacionOk
  | ResultadoAutenticacionError

export type EstadoSesion = 'restaurando' | 'autenticado' | 'anonimo'

/** Motivo por el que se cerró la sesión (para mostrar avisos en el login). */
export type MotivoCierre = 'expirada' | 'logout' | null

/** Métodos expuestos por `AuthContext`. */
export interface AuthContextValue {
  estado: EstadoSesion
  sesion: Sesion | null
  usuario: AuthUser | null
  motivoCierre: MotivoCierre
  login: (credenciales: CredencialesLogin) => Promise<ResultadoAutenticacion>
  loginDemo: (rolId: string) => Promise<ResultadoAutenticacion>
  logout: () => void
  /** Revalida la sesión activa contra la API y refresca el perfil en memoria/almacén. */
  refrescarSesion: () => Promise<void>
  /**
   * Re-descarga el usuario autenticado vía `GET /auth/me` y actualiza la
   * sesión en memoria/almacén sin revalidar el token. Devuelve el resultado
   * para que el consumidor distinga éxito de fallo.
   */
  refrescarPerfil: () => Promise<ResultadoServicio<AuthUser>>
  /** Helper DEV ONLY para simular que la sesión expiró en el backend. */
  forzarExpiracionDemo: () => void
  /** Autorización centralizada por permiso (ej. can("alumnos.ver")). */
  can: (permiso?: PermissionCode) => boolean
  /** Comprobación centralizada de rol (no debe usarse para autorizar acceso). */
  hasRole: (rolId: string) => boolean
}