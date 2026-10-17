import type { RolId, Usuario } from '@/types/rbac'
import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real de la API Express 5 (endpoints /api/usuarios/*).
/// La creación con contraseña opcional genera una aleatoria segura en el
/// backend (nunca se transita contraseñas por el cliente salvo la inicial).

export interface UsuarioConPersona extends Usuario {
  persona: {
    dni: string
    nombres: string
    apellidos: string
    codigoInstitucional: string
  } | null
}

/** Alta de cuenta: crea (o reutiliza) la persona y devuelve el código + contraseña inicial. */
export interface CrearUsuarioInput {
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  rolIds: RolId[]
  password?: string
}

/** Usuario creado: `passwordGenerada` solo se devuelve cuando el backend la generó (una única vez). */
export interface UsuarioCreado extends Usuario {
  passwordGenerada?: string
}

export async function listarUsuarios(): Promise<ResultadoServicio<UsuarioConPersona[]>> {
  return apiFetch<ResultadoServicio<UsuarioConPersona[]>>('/usuarios')
}

export async function crearUsuario(
  input: CrearUsuarioInput,
): Promise<ResultadoServicio<UsuarioCreado>> {
  return apiFetch<ResultadoServicio<UsuarioCreado>>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function desactivarUsuario(
  usuarioId: string,
): Promise<ResultadoServicio<Usuario>> {
  return apiFetch<ResultadoServicio<Usuario>>(`/usuarios/${usuarioId}/desactivar`, {
    method: 'POST',
  })
}

export async function reactivarUsuario(
  usuarioId: string,
): Promise<ResultadoServicio<Usuario>> {
  return apiFetch<ResultadoServicio<Usuario>>(`/usuarios/${usuarioId}/reactivar`, {
    method: 'POST',
  })
}

export async function asignarRoles(
  usuarioId: string,
  rolIds: RolId[],
): Promise<ResultadoServicio<Usuario>> {
  return apiFetch<ResultadoServicio<Usuario>>(`/usuarios/${usuarioId}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ rolIds }),
  })
}

/** Restablece la contraseña: genera una nueva, marca cambio obligatorio e invalida sesiones. */
export interface RestablecerContrasenaResultado {
  usuario: Usuario
  passwordGenerada: string
}

export async function restablecerContrasena(
  usuarioId: string,
): Promise<ResultadoServicio<RestablecerContrasenaResultado>> {
  return apiFetch<ResultadoServicio<RestablecerContrasenaResultado>>(
    `/usuarios/${usuarioId}/restablecer-password`,
    { method: 'POST' },
  )
}

/** Re-exposición de la contraseña temporal vigente (solo mientras deba cambiarse). */
export interface PasswordTemporalResultado {
  usuario: Usuario
  passwordTemporal: string
}

export async function verPasswordTemporal(
  usuarioId: string,
): Promise<ResultadoServicio<PasswordTemporalResultado>> {
  return apiFetch<ResultadoServicio<PasswordTemporalResultado>>(
    `/usuarios/${usuarioId}/password-temporal`,
  )
}

/** Contexto de una persona (por DNI) al momento de darle de alta la cuenta. */
export interface PersonaParaCuenta {
  persona: {
    id: string
    dni: string
    nombres: string
    apellidos: string
    codigoInstitucional: string
  }
  tieneCuenta: boolean
  esDocente: boolean
  esAlumno: boolean
}

export async function buscarPersonaParaCuenta(
  dni: string,
): Promise<ResultadoServicio<PersonaParaCuenta | null>> {
  return apiFetch<ResultadoServicio<PersonaParaCuenta | null>>(
    `/usuarios/buscar-persona?dni=${encodeURIComponent(dni)}`,
  )
}