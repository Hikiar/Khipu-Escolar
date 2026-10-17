import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import { autoCrearCompetenciasReferenciales } from './competencia.service.ts'
import { obtenerNivelesDeArea, NIVEL_LABELS, type NivelCurricular } from '../db/cneb.ts'

/**
 * Servicio de gestión de cursos/materias.
 * Reglas de negocio:
 * - Código y nombre son únicos.
 * - Un curso pertenece a uno o más grados via cursoGrados (plan de estudios).
 * - La edición permite actualizar nombre, descripción y estado activo.
 * - Desactivar = activo = false (no borrado lógico).
 * - Eliminar no está permitido si tiene cursoGrados, configuraciones de evaluación,
 *   competencias, trabajos, exámenes o asignaciones de curso.
 */

export interface CursoDto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface CrearCursoInput {
  codigo: string
  nombre: string
  descripcion?: string
  /** Grados del plan de estudios donde se dictará el curso. */
  grados?: { gradoId: string; horasSemana?: number; orden?: number }[]
  /** Modelo de evaluación por defecto para las configuraciones auto-creadas. */
  modeloEvaluacionId?: string
}

export interface ActualizarCursoInput {
  nombre?: string
  descripcion?: string
  activo?: boolean
}

function aCursoDto(curso: typeof s.cursos.$inferSelect): CursoDto {
  return {
    id: curso.id,
    codigo: curso.codigo,
    nombre: curso.nombre,
    descripcion: curso.descripcion ?? undefined,
    activo: curso.activo,
  }
}

export async function listarCursos(
  activos = true,
): Promise<ResultadoServicio<CursoDto[]>> {
  const cursos = acad.listarCursos()
  const data = cursos
    .filter((c) => !activos || c.activo)
    .map(aCursoDto)
  return exito(data)
}

export async function obtenerCurso(
  cursoId: string,
): Promise<ResultadoServicio<CursoDto>> {
  const curso = acad.obtenerCursoPorId(cursoId)
  if (!curso) {
    return fallo<CursoDto>('no-encontrado', `No existe un curso con id "${cursoId}".`)
  }
  return exito(aCursoDto(curso))
}

export async function crearCurso(
  input: CrearCursoInput,
): Promise<ResultadoServicio<CursoDto>> {
  const codigo = input.codigo.trim().toUpperCase()
  const nombre = input.nombre.trim()
  if (!codigo || !nombre) {
    return fallo<CursoDto>('invalido', 'Código y nombre son obligatorios.')
  }

  const existing = db.select().from(s.cursos).where(eq(s.cursos.codigo, codigo)).get()
  if (existing) {
    return fallo<CursoDto>('invalido', `Ya existe un curso con código "${codigo}".`)
  }

  // Validar grados y modelo ANTES de insertar, para no dejar el curso a medias.
  const gradosSeleccionados = (input.grados ?? []).map((g) => ({
    ...g,
    grado: acad.obtenerGradoPorId(g.gradoId),
  }))
  const gradoInvalido = gradosSeleccionados.find((g) => !g.grado)
  if (gradoInvalido) {
    return fallo<CursoDto>('no-encontrado', `No existe el grado "${gradoInvalido.gradoId}".`)
  }

  const nivelesValidos = obtenerNivelesDeArea(codigo)
  const nivelInvalido = gradosSeleccionados.find(
    (g) => g.grado && !nivelesValidos.includes(g.grado.nivel as NivelCurricular),
  )
  if (nivelInvalido?.grado) {
    const nivel = nivelInvalido.grado.nivel as NivelCurricular
    return fallo<CursoDto>(
      'invalido',
      `El curso "${nombre}" (${codigo}) no se dicta en el nivel ${NIVEL_LABELS[nivel]}. Solo aplica a: ${nivelesValidos
        .map((n) => NIVEL_LABELS[n])
        .join(', ')}.`,
    )
  }

  let modelo = input.modeloEvaluacionId
    ? evr.listarModelosEvaluacion().find((m) => m.id === input.modeloEvaluacionId)
    : evr.obtenerModeloEvaluacionPorCodigo('COMPETENCIAS')
  if (input.modeloEvaluacionId && !modelo) {
    return fallo<CursoDto>('no-encontrado', `No existe el modelo de evaluación "${input.modeloEvaluacionId}".`)
  }

  const id = `cur-${Date.now()}`
  db.insert(s.cursos).values({
    id,
    codigo,
    nombre,
    descripcion: input.descripcion?.trim() ?? null,
    activo: true,
  }).run()

  // Plan de estudios + configuración de evaluación por grado (auto).
  const periodoActivo = acad.obtenerPeriodoActivo()[0] ?? null
  for (const g of gradosSeleccionados) {
    db.insert(s.cursoGrados).values({
      cursoId: id,
      gradoId: g.gradoId,
      horasSemana: g.horasSemana ?? 4,
      orden: g.orden ?? 0,
    }).run()

    if (modelo && periodoActivo) {
      const configExistente = evr.obtenerConfiguracionEvaluacion(id, g.gradoId, periodoActivo.id)
      if (!configExistente) {
        const configId = `cfg-${Date.now()}`
        evr.insertarConfiguracion({
          id: configId,
          cursoId: id,
          gradoId: g.gradoId,
          periodoId: periodoActivo.id,
          modeloEvaluacionId: modelo.id,
          activo: true,
        })
        if (modelo.codigo === 'COMPETENCIAS') {
          autoCrearCompetenciasReferenciales(configId, id, g.gradoId)
        }
      }
    }
  }

  const creado = acad.obtenerCursoPorId(id)
  if (!creado) {
    return fallo<CursoDto>('no-disponible', 'No se pudo crear el curso.')
  }
  return exito(aCursoDto(creado))
}

export async function actualizarCurso(
  cursoId: string,
  input: ActualizarCursoInput,
): Promise<ResultadoServicio<CursoDto>> {
  const curso = acad.obtenerCursoPorId(cursoId)
  if (!curso) {
    return fallo<CursoDto>('no-encontrado', `No existe un curso con id "${cursoId}".`)
  }

  const patch: Partial<typeof s.cursos.$inferInsert> = {}
  if (input.nombre) patch.nombre = input.nombre.trim()
  if (input.descripcion !== undefined) patch.descripcion = input.descripcion?.trim() ?? null
  if (input.activo !== undefined) patch.activo = input.activo
  if (Object.keys(patch).length > 0) {
    db.update(s.cursos).set(patch).where(eq(s.cursos.id, cursoId)).run()
  }

  const actualizado = acad.obtenerCursoPorId(cursoId)
  if (!actualizado) {
    return fallo<CursoDto>('no-disponible', 'No se pudo actualizar el curso.')
  }
  return exito(aCursoDto(actualizado))
}

export async function desactivarCurso(
  cursoId: string,
): Promise<ResultadoServicio<CursoDto>> {
  const curso = acad.obtenerCursoPorId(cursoId)
  if (!curso) {
    return fallo<CursoDto>('no-encontrado', `No existe un curso con id "${cursoId}".`)
  }
  if (!curso.activo) {
    return fallo<CursoDto>('invalido', 'El curso ya está desactivado.')
  }

  // Verificar restricciones: cursoGrados, configuraciones, competencias, asignaciones, etc.
  const enPlan = db.select().from(s.cursoGrados).where(eq(s.cursoGrados.cursoId, cursoId)).all()
  if (enPlan.length > 0) {
    return fallo<CursoDto>('invalido', 'No se puede desactivar: el curso pertenece a planes de estudio.')
  }

  const configs = db.select().from(s.configuracionesEvaluacionCurso).where(eq(s.configuracionesEvaluacionCurso.cursoId, cursoId)).all()
  if (configs.length > 0) {
    return fallo<CursoDto>('invalido', 'No se puede desactivar: el curso tiene configuraciones de evaluación.')
  }

  const asignaciones = db.select().from(s.asignacionCursos).where(eq(s.asignacionCursos.cursoId, cursoId)).all()
  if (asignaciones.length > 0) {
    return fallo<CursoDto>('invalido', 'No se puede desactivar: el curso tiene asignaciones docentes.')
  }

  db.update(s.cursos).set({ activo: false }).where(eq(s.cursos.id, cursoId)).run()
  const actualizado = acad.obtenerCursoPorId(cursoId)
  if (!actualizado) {
    return fallo<CursoDto>('no-disponible', 'No se pudo desactivar el curso.')
  }
  return exito(aCursoDto(actualizado))
}

/** Vuelve a ACTIVO un curso desactivado. */
export async function reactivarCurso(
  cursoId: string,
): Promise<ResultadoServicio<CursoDto>> {
  const curso = acad.obtenerCursoPorId(cursoId)
  if (!curso) {
    return fallo<CursoDto>('no-encontrado', `No existe un curso con id "${cursoId}".`)
  }
  if (curso.activo) {
    return fallo<CursoDto>('invalido', 'El curso ya está activo.')
  }

  db.update(s.cursos).set({ activo: true }).where(eq(s.cursos.id, cursoId)).run()
  const actualizado = acad.obtenerCursoPorId(cursoId)
  if (!actualizado) {
    return fallo<CursoDto>('no-disponible', 'No se pudo reactivar el curso.')
  }
  return exito(aCursoDto(actualizado))
}