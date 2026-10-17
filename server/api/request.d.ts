import type { AuthUser } from '../../shared/types/auth.ts'

declare module 'express-serve-static-core' {
  interface Request {
    /** Usuario autenticado resuelto por `exigirAuth`. */
    auth?: AuthUser | null
    /** Token de sesión usado en la petición autenticada. */
    token?: string | null
  }
}

export {}