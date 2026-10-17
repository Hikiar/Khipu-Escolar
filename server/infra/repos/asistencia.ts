import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import * as s from '../../db/schema.ts'

/**
 * Repositorios del clúster de asistencia: registros diarios por Clase (alcance
 * AULA, cursoId NULL, o CURSO, cursoId fijado) y sus detalles por alumno
 * (reglas N6 e I5). Los estados son un subconjunto de texto validado por la
 * capa de servicio (PRESENTE/TARDE/FALTA/JUSTIFICADO).
 */

/** Asistencia de AULA (cursoId IS NULL) de una clase en una fecha. */
export const obtenerAsistenciaPorClaseYFecha = (claseId: string, fecha: string) =>
  db
    .select()
    .from(s.asistencias)
    .where(
      and(
        eq(s.asistencias.claseId, claseId),
        eq(s.asistencias.fecha, fecha),
        isNull(s.asistencias.cursoId),
      ),
    )
    .get() ?? null

/** Asistencia de CURSO (cursoId fijado) de una clase en una fecha. */
export const obtenerAsistenciaPorClaseCursoYFecha = (
  claseId: string,
  cursoId: string,
  fecha: string,
) =>
  db
    .select()
    .from(s.asistencias)
    .where(
      and(
        eq(s.asistencias.claseId, claseId),
        eq(s.asistencias.cursoId, cursoId),
        eq(s.asistencias.fecha, fecha),
      ),
    )
    .get() ?? null

export const obtenerAsistenciaPorId = (id: string) =>
  db.select().from(s.asistencias).where(eq(s.asistencias.id, id)).get() ?? null

export const insertarAsistencia = (fila: typeof s.asistencias.$inferInsert) =>
  db.insert(s.asistencias).values(fila).run()

export const modificarAsistencia = (
  id: string,
  parche: Partial<typeof s.asistencias.$inferInsert>,
): typeof s.asistencias.$inferSelect | null => {
  db.update(s.asistencias).set(parche).where(eq(s.asistencias.id, id)).run()
  return db.select().from(s.asistencias).where(eq(s.asistencias.id, id)).get() ?? null
}

/**
 * Histórico de una clase para un alcance. `cursoId === null` → solo AULA
 * (cursoId IS NULL); un cursoId → solo ese curso (evita mezclar alcances).
 */
export const listarAsistenciasDeClase = (claseId: string, cursoId: string | null = null) =>
  db
    .select()
    .from(s.asistencias)
    .where(
      and(
        eq(s.asistencias.claseId, claseId),
        cursoId === null ? isNull(s.asistencias.cursoId) : eq(s.asistencias.cursoId, cursoId),
      ),
    )
    .orderBy(s.asistencias.fecha)
    .all()

export const listarDetallesDeAsistencia = (asistenciaId: string) =>
  db.select().from(s.asistenciaDetalles).where(eq(s.asistenciaDetalles.asistenciaId, asistenciaId)).all()

export const insertarDetalles = (filas: (typeof s.asistenciaDetalles.$inferInsert)[]) =>
  db.insert(s.asistenciaDetalles).values(filas).run()

export const eliminarDetallesDeAsistencia = (asistenciaId: string) =>
  db.delete(s.asistenciaDetalles).where(eq(s.asistenciaDetalles.asistenciaId, asistenciaId)).run()