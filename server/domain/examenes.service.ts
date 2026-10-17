import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import type { AuthUser } from '../../shared/types/auth.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as rbac from '../infra/repos/rbac.ts'
import { validarPeriodoEscribible } from './periodos.service.ts'

/**
 * Servicio de exámenes (modelo EXAMEN, examen único por configuración y Clase).
 * Reglas: N12 (máx. 1 ExamenCurso por (config, Clase)), N5 (docente con
 * AsignacionCurso), N7 (nota 0–20, 2 decimales), I6 (alumno con matrícula
 * ACTIVA) y coherencia §13.6 (clase compatible con la configuración).
 */

export interface ExamenDto {
  id: string
  claseId: string
  configuracionEvaluacionCursoId: string
  nombre: string
  fecha?: string
  estado: string
}

export interface CrearExamenInput {
  claseId: string
  configuracionEvaluacionCursoId: string
  nombre: string
  fecha?: string
}

export interface ActualizarExamenInput {
  nombre?: string
  fecha?: string
  estado?: string
}

export interface CalificacionExamenDto {
  id: string
  examenCursoId: string
  alumnoId: string
  nota: number
  fechaRegistro: string
  observaciones?: string
  registradoPor: string
}

export interface RegistrarCalificacionExamenInput {
  examenCursoId: string
  alumnoId: string
  nota: number
  observaciones?: string
}

export interface CalificacionExamenConNombre extends CalificacionExamenDto {
  alumno: { nombreCompleto: string } | null
}

type FilaExamen = NonNullable<Awaited<ReturnType<typeof evr.obtenerExamenPorId>>>
type FilaCalExamen = Awaited<ReturnType<typeof evr.listarCalificacionesDeExamen>>[number]

function aExamenDto(f: FilaExamen): ExamenDto {
  return {
    id: f.id,
    claseId: f.claseId,
    configuracionEvaluacionCursoId: f.configuracionEvaluacionCursoId,
    nombre: f.nombre,
    fecha: f.fecha ?? undefined,
    estado: f.estado,
  }
}

function aCalificacionExamenDto(f: FilaCalExamen): CalificacionExamenDto {
  return {
    id: f.id,
    examenCursoId: f.examenCursoId,
    alumnoId: f.alumnoId,
    nota: f.nota,
    fechaRegistro: f.fechaRegistro,
    observaciones: f.observaciones ?? undefined,
    registradoPor: f.registradoPor,
  }
}

function validarNota(nota: number): boolean {
  if (!Number.isFinite(nota) || nota < 0 || nota > 20) return false
  return Math.round(nota * 100) === nota * 100
}

// ─────────────────────────── Exámenes ───────────────────────────

export async function crearExamen(
  input: CrearExamenInput,
  autor: AuthUser,
): Promise<ResultadoServicio<ExamenDto>> {
  const nombre = input.nombre.trim()
  if (!nombre) return fallo<ExamenDto>('invalido', 'El nombre del examen es obligatorio.')

  const clase = acad.obtenerClasePorId(input.claseId)
  if (!clase) return fallo<ExamenDto>('no-encontrado', 'No existe la clase indicada.')

  // N10: un periodo cerrado congela las calificaciones.
  const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
  if (errorPeriodo) return fallo<ExamenDto>('invalido', errorPeriodo)

  const config = evr.obtenerConfiguracionPorId(input.configuracionEvaluacionCursoId)
  if (!config) return fallo<ExamenDto>('no-encontrado', 'No existe la configuración indicada.')

  // §13.6: la clase y la configuración comparten la misma unidad (curso, grado, periodo).
  if (clase.periodoId !== config.periodoId || clase.gradoId !== config.gradoId) {
    return fallo<ExamenDto>(
      'invalido',
      'La clase no pertenece al (grado, periodo) de la configuración.',
    )
  }
  if (!acad.cursoEnPlanDeGrado(config.cursoId, clase.gradoId)) {
    return fallo<ExamenDto>('invalido', 'El curso de la configuración no pertenece al plan del grado de la clase.')
  }

  // N5: solo un docente con AsignacionCurso puede crear el examen.
  if (!acad.tieneAsignacionDocente(input.claseId, config.cursoId, autor.persona.id)) {
    return fallo<ExamenDto>(
      'invalido',
      'El docente no tiene AsignacionCurso para este (clase, curso) (N5).',
    )
  }

  // N12: a lo sumo un examen por (configuración, Clase).
  const existente = evr.obtenerExamenDeClaseYConfiguracion(
    input.claseId,
    input.configuracionEvaluacionCursoId,
  )
  if (existente) {
    return fallo<ExamenDto>('invalido', 'Ya existe un examen para esta clase y configuración.')
  }

  const id = `exa-${Date.now()}`
  evr.insertarExamen({
    id,
    claseId: input.claseId,
    configuracionEvaluacionCursoId: input.configuracionEvaluacionCursoId,
    nombre,
    fecha: input.fecha ?? null,
    estado: 'ACTIVO',
  })

  const creado = evr.obtenerExamenPorId(id)
  if (!creado) return fallo<ExamenDto>('no-disponible', 'No se pudo crear el examen.')
  return exito(aExamenDto(creado))
}

export async function actualizarExamen(
  examenId: string,
  input: ActualizarExamenInput,
): Promise<ResultadoServicio<ExamenDto>> {
  const examen = evr.obtenerExamenPorId(examenId)
  if (!examen) return fallo<ExamenDto>('no-encontrado', 'No existe el examen indicado.')

  // N10: un periodo cerrado congela las calificaciones.
  const clase = acad.obtenerClasePorId(examen.claseId)
  if (clase) {
    const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
    if (errorPeriodo) return fallo<ExamenDto>('invalido', errorPeriodo)
  }

  const parche: { nombre?: string; fecha?: string; estado?: string } = {}
  if (input.nombre !== undefined) {
    if (!input.nombre.trim()) return fallo<ExamenDto>('invalido', 'El nombre no puede estar vacío.')
    parche.nombre = input.nombre.trim()
  }
  if (input.fecha !== undefined) parche.fecha = input.fecha
  if (input.estado !== undefined) parche.estado = input.estado

  const actualizado = evr.modificarExamen(examenId, parche)
  if (!actualizado) return fallo<ExamenDto>('no-disponible', 'No se pudo actualizar el examen.')
  return exito(aExamenDto(actualizado))
}

export async function listarExamenesDeClase(
  claseId: string,
): Promise<ResultadoServicio<ExamenDto[]>> {
  const filas = evr.listarExamenesDeClase(claseId)
  return exito(filas.map(aExamenDto))
}

// ─────────────────────────── Calificaciones de examen ───────────────────────────

export async function registrarCalificacionExamen(
  input: RegistrarCalificacionExamenInput,
  autor: AuthUser,
): Promise<ResultadoServicio<CalificacionExamenDto>> {
  if (!validarNota(input.nota)) {
    return fallo<CalificacionExamenDto>(
      'invalido',
      'La nota debe estar entre 0 y 20 con hasta 2 decimales.',
    )
  }

  const examen = evr.obtenerExamenPorId(input.examenCursoId)
  if (!examen) return fallo<CalificacionExamenDto>('no-encontrado', 'No existe el examen indicado.')

  // N10: un periodo cerrado congela las calificaciones.
  const clase = acad.obtenerClasePorId(examen.claseId)
  if (clase) {
    const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
    if (errorPeriodo) return fallo<CalificacionExamenDto>('invalido', errorPeriodo)
  }

  // I6: el alumno debe tener matrícula ACTIVA en la Clase del examen.
  const matricula = acad.obtenerMatriculaActivaEnClase(input.alumnoId, examen.claseId)
  if (!matricula) {
    return fallo<CalificacionExamenDto>(
      'invalido',
      'El alumno no tiene una matrícula activa en esta clase.',
    )
  }

  // N5: quien califica debe ser docente con asignación en (clase, curso).
  const config = evr.obtenerConfiguracionPorId(examen.configuracionEvaluacionCursoId)
  if (!config) {
    return fallo<CalificacionExamenDto>('no-disponible', 'La configuración del examen no existe.')
  }
  if (!acad.tieneAsignacionDocente(examen.claseId, config.cursoId, autor.persona.id)) {
    return fallo<CalificacionExamenDto>(
      'invalido',
      'El docente no tiene AsignacionCurso para este (clase, curso) (N5).',
    )
  }

  evr.upsertCalificacionExamen({
    id: `calx-${Date.now()}`,
    examenCursoId: examen.id,
    alumnoId: input.alumnoId,
    nota: input.nota,
    fechaRegistro: new Date().toISOString(),
    observaciones: input.observaciones ?? null,
    registradoPor: autor.id,
  })

  const lista = evr.listarCalificacionesDeExamen(examen.id)
  const dto = lista.find((c) => c.alumnoId === input.alumnoId)
  return dto
    ? exito(aCalificacionExamenDto(dto))
    : fallo<CalificacionExamenDto>('no-disponible', 'No se pudo guardar la calificación.')
}

export async function listarCalificacionesDeExamen(
  examenCursoId: string,
): Promise<ResultadoServicio<CalificacionExamenConNombre[]>> {
  const examen = evr.obtenerExamenPorId(examenCursoId)
  if (!examen) {
    return fallo<CalificacionExamenConNombre[]>('no-encontrado', 'No existe el examen indicado.')
  }
  const filas = evr.listarCalificacionesDeExamen(examenCursoId)
  const dtos: CalificacionExamenConNombre[] = filas.map((f) => {
    const alumno = acad.obtenerAlumnoPorPersonaId(f.alumnoId)
    const persona = alumno ? rbac.obtenerPersonaPorId(alumno.personaId) : null
    return {
      ...aCalificacionExamenDto(f),
      alumno: persona ? { nombreCompleto: `${persona.nombres} ${persona.apellidos}` } : null,
    }
  })
  return exito(dtos)
}