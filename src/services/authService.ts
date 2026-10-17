import type {
  AuthUser,
  CredencialesLogin,
  ResultadoAutenticacion,
  Sesion,
} from '@/types/auth'
import type { ResultadoServicio } from '@/types/operations'
import { fallo } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real de la API Express 5 (endpoints /api/auth/*).
/// Los resultados replican el contrato de `shared/types/auth`.

export async function iniciarSesion(
  credenciales: CredencialesLogin,
): Promise<ResultadoAutenticacion> {
  return apiFetch<ResultadoAutenticacion>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credenciales),
  })
}

/** Login de desarrollo por rol (selector DEV ONLY). Solo el backend lo acepta. */
export async function iniciarSesionDemo(
  rolId: string,
): Promise<ResultadoAutenticacion> {
  return apiFetch<ResultadoAutenticacion>('/auth/demo', {
    method: 'POST',
    body: JSON.stringify({ rolId }),
  })
}

/** Valida una sesión persistida contra la API (expiración + usuario activo). */
export async function validarSesion(
  sesion: Sesion,
): Promise<ResultadoAutenticacion> {
  return apiFetch<ResultadoAutenticacion>('/auth/validar', {
    method: 'POST',
    tokenSesion: sesion.token,
    body: JSON.stringify({ token: sesion.token }),
  })
}

export async function cerrarSesion(token: string): Promise<void> {
  await apiFetch<void>('/auth/logout', {
    method: 'POST',
    tokenSesion: token,
    body: JSON.stringify({ token }),
  })
}

/**
 * Devuelve el usuario autenticado actual (`GET /auth/me`).
 * El endpoint responde `{ ok, usuario }` (sin envoltorio `data`), por lo que
 * el resultado se normaliza a `ResultadoServicio<AuthUser>`.
 */
type RespuestaUsuarioActual =
  | { ok: true; usuario: AuthUser }
  | { ok: false; error: string }

export async function obtenerUsuarioActual(): Promise<ResultadoServicio<AuthUser>> {
  const res = await apiFetch<RespuestaUsuarioActual>('/auth/me')
  if (res.ok === true) return { ok: true, data: res.usuario }
  return fallo<AuthUser>('no-disponible', 'No se pudo refrescar el perfil.')
}

export interface CambiarContrasenaInput {
  passwordActual: string
  passwordNueva: string
}

/** Cambia la contraseña de la sesión actual (mi perfil). */
export async function cambiarContrasena(
  input: CambiarContrasenaInput,
): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>('/auth/cambiar-contrasena', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}