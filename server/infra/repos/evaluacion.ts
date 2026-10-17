import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import * as s from '../../db/schema.ts'

/**
 * Repositorios del clúster de evaluación (Fase 2): modelos, configuraciones,
 * competencias, trabajos, exámenes y calificaciones.
 */

// ─────────────────────────── Modelos y configuraciones ───────────────────────────

export const listarModelosEvaluacion = () =>
  db.select().from(s.modelosEvaluacion).all()

export const obtenerModeloEvaluacionPorCodigo = (codigo: string) =>
  db.select().from(s.modelosEvaluacion).where(eq(s.modelosEvaluacion.codigo, codigo)).get() ?? null

export const obtenerConfiguracionEvaluacion = (cursoId: string, gradoId: string, periodoId: string) =>
  db
    .select()
    .from(s.configuracionesEvaluacionCurso)
    .where(
      and(
        eq(s.configuracionesEvaluacionCurso.cursoId, cursoId),
        eq(s.configuracionesEvaluacionCurso.gradoId, gradoId),
        eq(s.configuracionesEvaluacionCurso.periodoId, periodoId),
      ),
    )
    .get() ?? null

export const obtenerConfiguracionPorId = (id: string) =>
  db
    .select()
    .from(s.configuracionesEvaluacionCurso)
    .where(eq(s.configuracionesEvaluacionCurso.id, id))
    .get() ?? null

export const listarConfiguracionesDePeriodo = (periodoId: string | null) => {
  const base = db
    .select()
    .from(s.configuracionesEvaluacionCurso)
    .innerJoin(s.cursos, eq(s.configuracionesEvaluacionCurso.cursoId, s.cursos.id))
    .innerJoin(s.grados, eq(s.configuracionesEvaluacionCurso.gradoId, s.grados.id))
    .innerJoin(s.periodosAcademicos, eq(s.configuracionesEvaluacionCurso.periodoId, s.periodosAcademicos.id))
    .innerJoin(s.modelosEvaluacion, eq(s.configuracionesEvaluacionCurso.modeloEvaluacionId, s.modelosEvaluacion.id))
  
  if (periodoId) {
    return base.where(eq(s.configuracionesEvaluacionCurso.periodoId, periodoId)).all()
  }
  return base.all()
}

export const insertarConfiguracion = (fila: typeof s.configuracionesEvaluacionCurso.$inferInsert) =>
  db.insert(s.configuracionesEvaluacionCurso).values(fila).run()

export const actualizarModeloDeConfiguracion = (id: string, modeloEvaluacionId: string) =>
  db
    .update(s.configuracionesEvaluacionCurso)
    .set({ modeloEvaluacionId })
    .where(eq(s.configuracionesEvaluacionCurso.id, id))
    .run()

// ─────────────────────────── Competencias ───────────────────────────

export const listarCompetenciasDeConfiguracion = (configuracionId: string) =>
  db
    .select()
    .from(s.competenciasCurso)
    .where(eq(s.competenciasCurso.configuracionEvaluacionCursoId, configuracionId))
    .orderBy(s.competenciasCurso.orden, s.competenciasCurso.codigo)
    .all()

export const obtenerCompetenciaPorId = (id: string) =>
  db.select().from(s.competenciasCurso).where(eq(s.competenciasCurso.id, id)).get() ?? null

export const insertarCompetencia = (fila: typeof s.competenciasCurso.$inferInsert) =>
  db.insert(s.competenciasCurso).values(fila).run()

export const anularCompetencia = (id: string) =>
  db.update(s.competenciasCurso).set({ activo: false }).where(eq(s.competenciasCurso.id, id)).run()

// ─────────────────────────── Trabajos (competencias) ───────────────────────────

export const listarTrabajosDeClase = (claseId: string) =>
  db
    .select()
    .from(s.trabajosEvaluacion)
    .where(and(eq(s.trabajosEvaluacion.claseId, claseId), eq(s.trabajosEvaluacion.activo, true)))
    .orderBy(s.trabajosEvaluacion.fecha, s.trabajosEvaluacion.nombre)
    .all()

export const obtenerTrabajoPorId = (id: string) =>
  db.select().from(s.trabajosEvaluacion).where(eq(s.trabajosEvaluacion.id, id)).get() ?? null

export const modificarTrabajo = (
  id: string,
  parche: Partial<typeof s.trabajosEvaluacion.$inferInsert>,
): typeof s.trabajosEvaluacion.$inferSelect | null => {
  db.update(s.trabajosEvaluacion).set(parche).where(eq(s.trabajosEvaluacion.id, id)).run()
  return db.select().from(s.trabajosEvaluacion).where(eq(s.trabajosEvaluacion.id, id)).get() ?? null
}

export const insertarTrabajo = (fila: typeof s.trabajosEvaluacion.$inferInsert) =>
  db.insert(s.trabajosEvaluacion).values(fila).run()

export const anularTrabajo = (id: string) =>
  db.update(s.trabajosEvaluacion).set({ activo: false }).where(eq(s.trabajosEvaluacion.id, id)).run()

// ─────────────────────────── Exámenes ───────────────────────────

export const obtenerExamenDeClaseYConfiguracion = (claseId: string, configuracionId: string) =>
  db
    .select()
    .from(s.examenesCurso)
    .where(
      and(
        eq(s.examenesCurso.claseId, claseId),
        eq(s.examenesCurso.configuracionEvaluacionCursoId, configuracionId),
      ),
    )
    .get() ?? null

export const obtenerExamenPorId = (id: string) =>
  db.select().from(s.examenesCurso).where(eq(s.examenesCurso.id, id)).get() ?? null

export const listarExamenesDeClase = (claseId: string) =>
  db.select().from(s.examenesCurso).where(eq(s.examenesCurso.claseId, claseId)).all()

export const insertarExamen = (fila: typeof s.examenesCurso.$inferInsert) =>
  db.insert(s.examenesCurso).values(fila).run()

export const modificarExamen = (
  id: string,
  parche: Partial<typeof s.examenesCurso.$inferInsert>,
): typeof s.examenesCurso.$inferSelect | null => {
  db.update(s.examenesCurso).set(parche).where(eq(s.examenesCurso.id, id)).run()
  return db.select().from(s.examenesCurso).where(eq(s.examenesCurso.id, id)).get() ?? null
}

// ─────────────────────────── Calificaciones ───────────────────────────

export const upsertCalificacionTrabajo = (fila: typeof s.calificacionesTrabajo.$inferInsert) =>
  db.insert(s.calificacionesTrabajo).values(fila).onConflictDoUpdate({
    target: [s.calificacionesTrabajo.trabajoEvaluacionId, s.calificacionesTrabajo.alumnoId],
    set: {
      nota: fila.nota,
      observaciones: fila.observaciones,
      fechaRegistro: fila.fechaRegistro,
      registradoPor: fila.registradoPor,
    },
  }).run()

export const upsertCalificacionExamen = (fila: typeof s.calificacionesExamen.$inferInsert) =>
  db.insert(s.calificacionesExamen).values(fila).onConflictDoUpdate({
    target: [s.calificacionesExamen.examenCursoId, s.calificacionesExamen.alumnoId],
    set: {
      nota: fila.nota,
      observaciones: fila.observaciones,
      fechaRegistro: fila.fechaRegistro,
      registradoPor: fila.registradoPor,
    },
  }).run()

export const listarCalificacionesDeTrabajo = (trabajoEvaluacionId: string) =>
  db
    .select()
    .from(s.calificacionesTrabajo)
    .where(eq(s.calificacionesTrabajo.trabajoEvaluacionId, trabajoEvaluacionId))
    .all()

export const listarCalificacionesDeExamen = (examenCursoId: string) =>
  db
    .select()
    .from(s.calificacionesExamen)
    .where(eq(s.calificacionesExamen.examenCursoId, examenCursoId))
    .all()

export const listarCalificacionesTrabajoDeAlumnoEnClase = (claseId: string, alumnoId: string) =>
  db
    .select()
    .from(s.calificacionesTrabajo)
    .innerJoin(s.trabajosEvaluacion, eq(s.calificacionesTrabajo.trabajoEvaluacionId, s.trabajosEvaluacion.id))
    .where(and(eq(s.trabajosEvaluacion.claseId, claseId), eq(s.calificacionesTrabajo.alumnoId, alumnoId)))
    .all()

export const listarCalificacionesExamenDeAlumnoEnClase = (claseId: string, alumnoId: string) =>
  db
    .select()
    .from(s.calificacionesExamen)
    .innerJoin(s.examenesCurso, eq(s.calificacionesExamen.examenCursoId, s.examenesCurso.id))
    .where(and(eq(s.examenesCurso.claseId, claseId), eq(s.calificacionesExamen.alumnoId, alumnoId)))
    .all()