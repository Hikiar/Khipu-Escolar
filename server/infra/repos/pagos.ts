import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import * as s from '../../db/schema.ts'

/**
 * Repositorio del clúster de pagos: conceptos (cronograma) y pagos por alumno.
 * Regla N4: un pago REGISTRADO por (alumno, concepto); la UQ completa
 * `(alumnoId, conceptoId)` impide segundas filas, así que re-registrar un
 * concepto cuyo pago fue ANULADO reutiliza la fila (UPDATE), conservando el
 * historial de auditoría.
 */

// ─────────────────────────── Conceptos ───────────────────────────

export const listarConceptosDePeriodo = (periodoId: string) =>
  db.select().from(s.conceptosPago).where(eq(s.conceptosPago.periodoId, periodoId)).all()

export const obtenerConceptoPorId = (id: string) =>
  db.select().from(s.conceptosPago).where(eq(s.conceptosPago.id, id)).get() ?? null

export const obtenerConceptoDePeriodoYCodigo = (periodoId: string, codigo: string) =>
  db
    .select()
    .from(s.conceptosPago)
    .where(and(eq(s.conceptosPago.periodoId, periodoId), eq(s.conceptosPago.codigo, codigo)))
    .get() ?? null

export const insertarConcepto = (fila: typeof s.conceptosPago.$inferInsert) =>
  db.insert(s.conceptosPago).values(fila).run()

export const modificarConcepto = (
  id: string,
  parche: Partial<typeof s.conceptosPago.$inferInsert>,
): typeof s.conceptosPago.$inferSelect | null => {
  db.update(s.conceptosPago).set(parche).where(eq(s.conceptosPago.id, id)).run()
  return obtenerConceptoPorId(id)
}

export const eliminarConcepto = (id: string) =>
  db.delete(s.conceptosPago).where(eq(s.conceptosPago.id, id)).run()

/** Cuenta los pagos (cualquier estado) que referencian el concepto (guardia del FK restrict). */
export const contarPagosDeConcepto = (conceptoId: string) =>
  db.select({ id: s.pagos.id }).from(s.pagos).where(eq(s.pagos.conceptoId, conceptoId)).all().length

// ─────────────────────────── Pagos ───────────────────────────

export const obtenerPagoPorId = (id: string) =>
  db.select().from(s.pagos).where(eq(s.pagos.id, id)).get() ?? null

/** Fila de pago de un (alumno, concepto), regida por la UQ completa. */
export const obtenerPagoDeAlumnoYConcepto = (alumnoId: string, conceptoId: string) =>
  db
    .select()
    .from(s.pagos)
    .where(and(eq(s.pagos.alumnoId, alumnoId), eq(s.pagos.conceptoId, conceptoId)))
    .get() ?? null

export const insertarPago = (fila: typeof s.pagos.$inferInsert) =>
  db.insert(s.pagos).values(fila).run()

export const modificarPago = (
  id: string,
  parche: Partial<typeof s.pagos.$inferInsert>,
): typeof s.pagos.$inferSelect | null => {
  db.update(s.pagos).set(parche).where(eq(s.pagos.id, id)).run()
  return db.select().from(s.pagos).where(eq(s.pagos.id, id)).get() ?? null
}

/** Pagos de un alumno con el nombre del concepto (join). */
export const listarPagosDeAlumno = (alumnoId: string) =>
  db
    .select()
    .from(s.pagos)
    .innerJoin(s.conceptosPago, eq(s.pagos.conceptoId, s.conceptosPago.id))
    .where(eq(s.pagos.alumnoId, alumnoId))
    .all()

/** Pagos de un alumno filtrados por el periodo del concepto. */
export const listarPagosDeAlumnoEnPeriodo = (alumnoId: string, periodoId: string) =>
  db
    .select()
    .from(s.pagos)
    .innerJoin(s.conceptosPago, eq(s.pagos.conceptoId, s.conceptosPago.id))
    .where(and(eq(s.pagos.alumnoId, alumnoId), eq(s.conceptosPago.periodoId, periodoId)))
    .all()

/** ¿El alumno tiene algún pago REGISTRADO en el periodo (para N9)? */
export const contarPagosRegistradosDeAlumno = (alumnoId: string, periodoId: string) =>
  db
    .select({ total: s.pagos.id })
    .from(s.pagos)
    .innerJoin(s.conceptosPago, eq(s.pagos.conceptoId, s.conceptosPago.id))
    .where(
      and(
        eq(s.pagos.alumnoId, alumnoId),
        eq(s.conceptosPago.periodoId, periodoId),
        eq(s.pagos.estado, 'REGISTRADO'),
      ),
    )
    .all().length