import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import type { AuthUser } from '../../shared/types/auth.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as rbac from '../infra/repos/rbac.ts'
import { validarPeriodoEscribible } from './periodos.service.ts'

/**
 * Servicio de trabajos y calificaciones (modelo COMPETENCIAS).
 * Reglas: N5 (docente solo sus asignaciones), N7 (nota 0–20, 2 decimales),
 * N11 (trabajos dinámicos), I6 (alumno con matrícula ACTIVA), I8 (una
 * calificación por par trabajo/alumno) y coherencia §13.6.
 */

export interface TrabajoDto {
  id: string
  claseId: string
  competenciaCursoId: string
  nombre: string
  descripcion?: string
  fecha?: string
  activo: boolean
}

export interface CrearTrabajoInput {
  claseId: string
  competenciaCursoId: string
  nombre: string
  descripcion?: string
  fecha?: string
}

export interface ActualizarTrabajoInput {
  nombre?: string
  descripcion?: string
  fecha?: string
  activo?: boolean
}

export interface CalificacionTrabajoDto {
  id: string
  trabajoEvaluacionId: string
  alumnoId: string
  nota: number
  fechaRegistro: string
  observaciones?: string
  registradoPor: string
}

export interface RegistrarCalificacionTrabajoInput {
  trabajoEvaluacionId: string
  alumnoId: string
  nota: number
  observaciones?: string
}

export interface JsonCalificacionConNombre extends CalificacionTrabajoDto {
  alumno: { nombreCompleto: string } | null
}

function aTrabajoDto(f: FilaTrabajo): TrabajoDto {
  return {
    id: f.id,
    claseId: f.claseId,
    competenciaCursoId: f.competenciaCursoId,
    nombre: f.nombre,
    descripcion: f.descripcion ?? undefined,
    fecha: f.fecha ?? undefined,
    activo: f.activo ?? true,
  }
}

function aCalificacionDto(f: CalificacionSinNombre): CalificacionTrabajoDto {
  return {
    id: f.id,
    trabajoEvaluacionId: f.trabajoEvaluacionId,
    alumnoId: f.alumnoId,
    nota: f.nota,
    fechaRegistro: f.fechaRegistro,
    observaciones: f.observaciones ?? undefined,
    registradoPor: f.registradoPor,
  }
}

export type FilaTrabajo = NonNullable<Awaited<ReturnType<typeof evr.obtenerTrabajoPorId>>>
export type CalificacionSinNombre = Awaited<ReturnType<typeof evr.listarCalificacionesDeTrabajo>>[number]

function validarNota(nota: number): boolean {
  if (!Number.isFinite(nota) || nota < 0 || nota > 20) return false
  return Math.round(nota * 100) === nota * 100
}

/**
 * Valida coherencia §13.6: la config de la competencia y la Clase comparten
 * la misma unidad (curso, grado, periodo) y el docente tiene AsignacionCurso (N5).
 */
function validarUnidadCompetenciaClase(
  clase: { periodoId: string; gradoId: string },
  config: { cursoId: string; gradoId: string; periodoId: string },
  docenteId: string,
  claseId: string,
): string | null {
  if (clase.periodoId !== config.periodoId || clase.gradoId !== config.gradoId) {
    return 'La clase no pertenece al (grado, periodo) de la configuración de la competencia.'
  }
  if (!acad.cursoEnPlanDeGrado(config.cursoId, clase.gradoId)) {
    return 'El curso de la competencia no pertenece al plan del grado de la clase.'
  }
  if (!acad.tieneAsignacionDocente(claseId, config.cursoId, docenteId)) {
    return 'El docente no tiene AsignacionCurso para (clase, curso) de la competencia (N5).'
  }
  return null
}

// ─────────────────────────── Trabajos ───────────────────────────

export async function crearTrabajo(
  input: CrearTrabajoInput,
  autor: AuthUser,
): Promise<ResultadoServicio<TrabajoDto>> {
  const nombre = input.nombre.trim()
  if (!nombre) return fallo<TrabajoDto>('invalido', 'El nombre del trabajo es obligatorio.')

  const clase = acad.obtenerClasePorId(input.claseId)
  if (!clase) return fallo<TrabajoDto>('no-encontrado', 'No existe la clase indicada.')

  // N10: un periodo cerrado congela las calificaciones.
  const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
  if (errorPeriodo) return fallo<TrabajoDto>('invalido', errorPeriodo)

  const competencia = evr.obtenerCompetenciaPorId(input.competenciaCursoId)
  if (!competencia || !competencia.activo) {
    return fallo<TrabajoDto>('no-encontrado', 'No existe la competencia indicada o está inactiva.')
  }

  const config = evr.obtenerConfiguracionPorId(competencia.configuracionEvaluacionCursoId)
  if (!config) return fallo<TrabajoDto>('no-disponible', 'La configuración de la competencia no existe.')

  const errorUnidad = validarUnidadCompetenciaClase(
    clase,
    config,
    autor.persona.id,
    input.claseId,
  )
  if (errorUnidad) return fallo<TrabajoDto>('invalido', errorUnidad)

  const id = `trb-${Date.now()}`
  evr.insertarTrabajo({
    id,
    claseId: input.claseId,
    competenciaCursoId: input.competenciaCursoId,
    nombre,
    descripcion: input.descripcion ?? null,
    fecha: input.fecha ?? null,
    activo: true,
  })

  const creado = evr.obtenerTrabajoPorId(id)
  if (!creado) return fallo<TrabajoDto>('no-disponible', 'No se pudo crear el trabajo.')
  return exito(aTrabajoDto(creado))
}

export async function actualizarTrabajo(
  trabajoId: string,
  input: ActualizarTrabajoInput,
): Promise<ResultadoServicio<TrabajoDto>> {
  const trabajo = evr.obtenerTrabajoPorId(trabajoId)
  if (!trabajo) return fallo<TrabajoDto>('no-encontrado', 'No existe el trabajo indicado.')

  // N10: un periodo cerrado congela las calificaciones.
  const clase = acad.obtenerClasePorId(trabajo.claseId)
  if (clase) {
    const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
    if (errorPeriodo) return fallo<TrabajoDto>('invalido', errorPeriodo)
  }

  const parche: { nombre?: string; descripcion?: string; fecha?: string; activo?: boolean } = {}
  if (input.nombre !== undefined) {
    if (!input.nombre.trim()) return fallo<TrabajoDto>('invalido', 'El nombre no puede estar vacío.')
    parche.nombre = input.nombre.trim()
  }
  if (input.descripcion !== undefined) parche.descripcion = input.descripcion
  if (input.fecha !== undefined) parche.fecha = input.fecha
  if (input.activo !== undefined) parche.activo = input.activo

  const actualizado = evr.modificarTrabajo(trabajoId, parche)
  if (!actualizado) return fallo<TrabajoDto>('no-disponible', 'No se pudo actualizar el trabajo.')
  return exito(aTrabajoDto(actualizado))
}

export async function anularTrabajo(trabajoId: string): Promise<ResultadoServicio<TrabajoDto>> {
  const trabajo = evr.obtenerTrabajoPorId(trabajoId)
  if (!trabajo) return fallo<TrabajoDto>('no-encontrado', 'No existe el trabajo indicado.')

  // N10: un periodo cerrado congela las calificaciones.
  const clase = acad.obtenerClasePorId(trabajo.claseId)
  if (clase) {
    const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
    if (errorPeriodo) return fallo<TrabajoDto>('invalido', errorPeriodo)
  }

  evr.anularTrabajo(trabajoId)
  return exito(aTrabajoDto({ ...trabajo, activo: false }))
}

export async function listarTrabajosDeClase(
  claseId: string,
): Promise<ResultadoServicio<TrabajoDto[]>> {
  const filas = evr.listarTrabajosDeClase(claseId)
  return exito(filas.map(aTrabajoDto))
}

export async function listarTrabajosDeCompetencia(
  claseId: string,
  competenciaCursoId: string,
): Promise<ResultadoServicio<TrabajoDto[]>> {
  const filas = evr.listarTrabajosDeClase(claseId).filter(
    (f) => f.competenciaCursoId === competenciaCursoId,
  )
  return exito(filas.map(aTrabajoDto))
}

// ─────────────────────────── Calificaciones ───────────────────────────

export async function registrarCalificacionTrabajo(
  input: RegistrarCalificacionTrabajoInput,
  autor: AuthUser,
): Promise<ResultadoServicio<CalificacionTrabajoDto>> {
  if (!validarNota(input.nota)) {
    return fallo<CalificacionTrabajoDto>(
      'invalido',
      'La nota debe estar entre 0 y 20 con hasta 2 decimales.',
    )
  }

  const trabajo = evr.obtenerTrabajoPorId(input.trabajoEvaluacionId)
  if (!trabajo || !trabajo.activo) {
    return fallo<CalificacionTrabajoDto>(
      'no-encontrado',
      'No existe el trabajo indicado o está inactivo.',
    )
  }

  // N10: un periodo cerrado congela las calificaciones.
  const clase = acad.obtenerClasePorId(trabajo.claseId)
  if (clase) {
    const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
    if (errorPeriodo) return fallo<CalificacionTrabajoDto>('invalido', errorPeriodo)
  }

  // I6: el alumno debe tener matrícula ACTIVA en la Clase del trabajo.
  const matricula = acad.obtenerMatriculaActivaEnClase(input.alumnoId, trabajo.claseId)
  if (!matricula) {
    return fallo<CalificacionTrabajoDto>(
      'invalido',
      'El alumno no tiene una matrícula activa en esta clase.',
    )
  }

  // N5: quien califica debe ser docente con asignación en (clase, curso).
  const competencia = evr.obtenerCompetenciaPorId(trabajo.competenciaCursoId)
  const config = competencia
    ? evr.obtenerConfiguracionPorId(competencia.configuracionEvaluacionCursoId)
    : null
  if (!competencia || !config) {
    return fallo<CalificacionTrabajoDto>('no-disponible', 'La competencia o su configuración no existen.')
  }
  if (!acad.tieneAsignacionDocente(trabajo.claseId, config.cursoId, autor.persona.id)) {
    return fallo<CalificacionTrabajoDto>(
      'invalido',
      'El docente no tiene AsignacionCurso para este (clase, curso) (N5).',
    )
  }

  evr.upsertCalificacionTrabajo({
    id: `cal-${Date.now()}`,
    trabajoEvaluacionId: trabajo.id,
    alumnoId: input.alumnoId,
    nota: input.nota,
    fechaRegistro: new Date().toISOString(),
    observaciones: input.observaciones ?? null,
    registradoPor: autor.id,
  })

  const lista = evr.listarCalificacionesDeTrabajo(trabajo.id)
  const dto = lista.find((c) => c.alumnoId === input.alumnoId)
  return dto ? exito(aCalificacionDto(dto)) : fallo<CalificacionTrabajoDto>('no-disponible', 'No se pudo guardar la calificación.')
}

export async function listarCalificacionesDeTrabajo(
  trabajoEvaluacionId: string,
): Promise<ResultadoServicio<JsonCalificacionConNombre[]>> {
  const trabajo = evr.obtenerTrabajoPorId(trabajoEvaluacionId)
  if (!trabajo) {
    return fallo<JsonCalificacionConNombre[]>('no-encontrado', 'No existe el trabajo indicado.')
  }
  const filas = evr.listarCalificacionesDeTrabajo(trabajoEvaluacionId)
  const dtos: JsonCalificacionConNombre[] = filas.map((f) => {
    const alumno = acad.obtenerAlumnoPorPersonaId(f.alumnoId)
    const persona = alumno ? rbac.obtenerPersonaPorId(alumno.personaId) : null
    return {
      ...aCalificacionDto(f),
      alumno: persona
        ? { nombreCompleto: `${persona.nombres} ${persona.apellidos}` }
        : null,
    }
  })
  return exito(dtos)
}