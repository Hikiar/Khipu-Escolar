import type { ResultadoServicio } from '@/types/operations'
import { fallo } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real de la API Express 5 (endpoint /api/auditoría).
/// Nota: el endpoint NO usa el envoltorio `ResultadoServicio` estándar
/// (`{ ok, data }`); responde `{ ok, registros }`. Este servicio lo
/// normaliza para que las páginas consuman el patrón ADT uniforme.

/** Registro de la bitácora (espejo de la tabla `auditoria`, schema.ts:562-572). */
export interface RegistroAuditoria {
  id: number
  usuarioId: string | null
  /** Método HTTP de la mutación: POST | PUT | PATCH | DELETE. */
  metodo: string
  /** Ruta auditada (incluye query string). */
  ruta: string
  /** Status HTTP de la respuesta. */
  status: number
  ip: string | null
  /** ISO 8601. */
  createdAt: string
}

/** Formato real del cuerpo de `GET /api/auditoria`. */
type RespuestaAuditoria =
  | { ok: true; registros: RegistroAuditoria[] }
  | { ok: false; error: string }

/** Los 200 registros más recientes (el endpoint no soporta filtros ni paginación). */
export async function listarAuditoria(): Promise<ResultadoServicio<RegistroAuditoria[]>> {
  const res = await apiFetch<RespuestaAuditoria>('/auditoria')
  if (res.ok === true) return { ok: true, data: res.registros }
  return fallo<RegistroAuditoria[]>('no-disponible', 'No se pudo cargar la auditoría.')
}
