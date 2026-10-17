import { desc } from 'drizzle-orm'
import { auditoria, type Auditoria } from '../../db/schema.ts'
import { db } from '../../db/client.ts'

/**
 * Bitácora de auditoría: cada mutación HTTP (POST/PUT/PATCH/DELETE) registra
 * usuario, método, ruta, status e IP. Tabla de solo escritura desde la API;
 * lectura restringida a usuarios con permiso total.
 */

export interface RegistroAuditoria {
  usuarioId: string | null
  metodo: string
  ruta: string
  status: number
  ip: string | null
}

export function registrarAuditoria(registro: RegistroAuditoria): void {
  db.insert(auditoria)
    .values({
      usuarioId: registro.usuarioId,
      metodo: registro.metodo,
      ruta: registro.ruta,
      status: registro.status,
      ip: registro.ip,
      createdAt: new Date().toISOString(),
    })
    .run()
}

export function listarAuditoria(limite = 200): Auditoria[] {
  return db
    .select()
    .from(auditoria)
    .orderBy(desc(auditoria.id))
    .limit(limite)
    .all()
}