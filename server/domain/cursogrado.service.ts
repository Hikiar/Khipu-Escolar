import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq, and, inArray } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as acad from '../infra/repos/academicos.ts'
import { autoCrearCompetenciasReferenciales } from './competencia.service.ts'
import { obtenerNivelesDeArea, NIVEL_LABELS, type NivelCurricular } from '../db/cneb.ts'

/**
 * Servicio de Plan de Estudios (CursoGrado).
 * Relación N-M entre Curso y Grado con atributos adicionales:
 * - horasSemana: horas semanales del curso en ese grado
 * - orden: orden de visualización en el plan de estudios
 */

export interface CursoGradoDto {
  cursoId: string
  cursoCodigo: string
  cursoNombre: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  horasSemana: number | null
  orden: number | null
}

export interface CursoGradoSimpleDto {
  cursoId: string
  cursoCodigo: string
  cursoNombre: string
  horasSemana: number | null
  orden: number | null
}

export interface GradoCursoDto {
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  horasSemana: number | null
  orden: number | null
}

export interface CrearCursoGradoInput {
  cursoId: string
  gradoId: string
  horasSemana?: number
  orden?: number
}

export interface ActualizarCursoGradoInput {
  horasSemana?: number
  orden?: number
}

export async function listarCursosDeGrado(
  gradoId: string
): Promise<ResultadoServicio<CursoGradoSimpleDto[]>> {
  const filas = db
    .select()
    .from(s.cursoGrados)
    .innerJoin(s.cursos, eq(s.cursoGrados.cursoId, s.cursos.id))
    .where(eq(s.cursoGrados.gradoId, gradoId))
    .orderBy(s.cursoGrados.orden, s.cursos.nombre)
    .all()

  const data: CursoGradoSimpleDto[] = filas.map((f) => ({
    cursoId: f.cursos.id,
    cursoCodigo: f.cursos.codigo,
    cursoNombre: f.cursos.nombre,
    horasSemana: f.curso_grados.horasSemana,
    orden: f.curso_grados.orden,
  }))
  return exito(data)
}

export async function listarGradosDeCurso(
  cursoId: string
): Promise<ResultadoServicio<GradoCursoDto[]>> {
  const filas = db
    .select()
    .from(s.cursoGrados)
    .innerJoin(s.grados, eq(s.cursoGrados.gradoId, s.grados.id))
    .where(eq(s.cursoGrados.cursoId, cursoId))
    .orderBy(s.cursoGrados.orden, s.grados.nombre)
    .all()

  const data: GradoCursoDto[] = filas.map((f) => ({
    gradoId: f.grados.id,
    gradoCodigo: f.grados.codigo,
    gradoNombre: f.grados.nombre,
    horasSemana: f.curso_grados.horasSemana,
    orden: f.curso_grados.orden,
  }))
  return exito(data)
}

export async function listarCursoGrado(
  cursoId: string,
  gradoId: string
): Promise<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>> {
  const fila = db
    .select()
    .from(s.cursoGrados)
    .where(and(eq(s.cursoGrados.cursoId, cursoId), eq(s.cursoGrados.gradoId, gradoId)))
    .get()

  if (!fila) {
    return fallo('no-encontrado', 'El curso no está en el plan de estudios de ese grado.')
  }
  return exito({
    cursoId: fila.cursoId,
    gradoId: fila.gradoId,
    horasSemana: fila.horasSemana,
    orden: fila.orden,
  })
}

export async function agregarCursoAGrado(
  input: { cursoId: string; gradoId: string; horasSemana?: number; orden?: number }
): Promise<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>> {
  const curso = db.select().from(s.cursos).where(eq(s.cursos.id, input.cursoId)).get()
  if (!curso) {
    return fallo('no-encontrado', `No existe el curso "${input.cursoId}".`)
  }
  const grado = db.select().from(s.grados).where(eq(s.grados.id, input.gradoId)).get()
  if (!grado) {
    return fallo('no-encontrado', `No existe el grado "${input.gradoId}".`)
  }

  const nivelesValidos = obtenerNivelesDeArea(curso.codigo)
  if (!nivelesValidos.includes(grado.nivel as NivelCurricular)) {
    const nivel = grado.nivel as NivelCurricular
    return fallo(
      'invalido',
      `El curso "${curso.nombre}" (${curso.codigo}) no se dicta en el nivel ${NIVEL_LABELS[nivel]} (${grado.nombre}). Solo aplica a: ${nivelesValidos
        .map((n) => NIVEL_LABELS[n])
        .join(', ')}.`,
    )
  }

  const existing = db
    .select()
    .from(s.cursoGrados)
    .where(and(eq(s.cursoGrados.cursoId, input.cursoId), eq(s.cursoGrados.gradoId, input.gradoId)))
    .get()

  if (existing) {
    return fallo('invalido', 'El curso ya está en el plan de estudios de ese grado.')
  }

  db.insert(s.cursoGrados).values({
    cursoId: input.cursoId,
    gradoId: input.gradoId,
    horasSemana: input.horasSemana ?? null,
    orden: input.orden ?? null,
  }).run()

  // FASE 3: Auto-crear ConfiguracionEvaluacionCurso con modelo COMPETENCIAS
  try {
    const periodosActivos = acad.obtenerPeriodoActivo()
    const periodoActivo = periodosActivos[0]
    if (periodoActivo) {
      const modeloCompetencias = evr.obtenerModeloEvaluacionPorCodigo('COMPETENCIAS')
      if (modeloCompetencias) {
        const configExistente = evr.obtenerConfiguracionEvaluacion(input.cursoId, input.gradoId, periodoActivo.id)
        if (!configExistente) {
          const configId = `cfg-${Date.now()}`
          evr.insertarConfiguracion({
            id: configId,
            cursoId: input.cursoId,
            gradoId: input.gradoId,
            periodoId: periodoActivo.id,
            modeloEvaluacionId: modeloCompetencias.id,
            activo: true,
          })
          autoCrearCompetenciasReferenciales(configId, input.cursoId, input.gradoId)
        }
      }
    }
  } catch {
    // No fallar la operación principal si falla la auto-creación
    console.warn('[cursogrado] No se pudo auto-crear ConfiguracionEvaluacionCurso')
  }

  return exito({
    cursoId: input.cursoId,
    gradoId: input.gradoId,
    horasSemana: input.horasSemana ?? null,
    orden: input.orden ?? null,
  })
}

export async function actualizarCursoGrado(
  cursoId: string,
  gradoId: string,
  input: { horasSemana?: number; orden?: number }
): Promise<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>> {
  const existing = db
    .select()
    .from(s.cursoGrados)
    .where(and(eq(s.cursoGrados.cursoId, cursoId), eq(s.cursoGrados.gradoId, gradoId)))
    .get()

  if (!existing) {
    return fallo('no-encontrado', 'El curso no está en el plan de estudios de ese grado.')
  }

  const patch: Record<string, unknown> = {}
  if (input.horasSemana !== undefined) patch.horasSemana = input.horasSemana
  if (input.orden !== undefined) patch.orden = input.orden

  if (Object.keys(patch).length > 0) {
    db.update(s.cursoGrados)
      .set(patch)
      .where(and(eq(s.cursoGrados.cursoId, cursoId), eq(s.cursoGrados.gradoId, gradoId)))
      .run()
  }

  return exito({
    cursoId,
    gradoId,
    horasSemana: input.horasSemana ?? existing.horasSemana,
    orden: input.orden ?? existing.orden,
  })
}

export async function quitarCursoDeGrado(
  cursoId: string,
  gradoId: string
): Promise<ResultadoServicio<void>> {
  const existing = db
    .select()
    .from(s.cursoGrados)
    .where(and(eq(s.cursoGrados.cursoId, cursoId), eq(s.cursoGrados.gradoId, gradoId)))
    .get()

  if (!existing) {
    return fallo('no-encontrado', 'El curso no está en el plan de estudios de ese grado.')
  }

  const clases = db
    .select({ id: s.clases.id })
    .from(s.clases)
    .where(eq(s.clases.gradoId, gradoId))
    .all()

  if (clases.length > 0) {
    const claseIds = clases.map((c) => c.id)
    const asignaciones = db
      .select()
      .from(s.asignacionCursos)
      .where(
        and(
          eq(s.asignacionCursos.cursoId, cursoId),
          inArray(s.asignacionCursos.claseId, claseIds)
        )
      )
      .all()

    if (asignaciones.length > 0) {
      return fallo('invalido', 'No se puede quitar: hay asignaciones docentes activas para este curso en ese grado.')
    }
  }

  db.delete(s.cursoGrados)
    .where(and(eq(s.cursoGrados.cursoId, cursoId), eq(s.cursoGrados.gradoId, gradoId)))
    .run()

  return exito(undefined)
}