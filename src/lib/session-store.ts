import type { Sesion } from '@/types/auth'

/**
 * Persistencia de la sesión en localStorage.
 *
 * SEGURIDAD: jamás se guardan contraseñas ni secretos. Solo se persiste la
 * sesión emitida por `authService` (token + perfil + expiración), que además
 * se revalida al restaurarla contra la API (`/auth/validar`).
 */
const SESSION_STORAGE_KEY = 'csm.auth.sesion'

export function guardarSesion(sesion: Sesion): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion))
  } catch {
    // storage no disponible (p. ej. modo privado): la sesión vive solo en memoria
  }
}

export function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const sesion = JSON.parse(raw) as Sesion
    return sesion.token && sesion.expiresAt ? sesion : null
  } catch {
    return null
  }
}

export function limpiarSesion(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // sin opción
  }
}