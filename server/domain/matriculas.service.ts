import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import type { AuthUser } from '../../shared/types/auth.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as evalr from '../infra/repos/evaluacion.ts'
import { contarPagosRegistradosDeAlumno } from '../infra/repos/pagos.ts'
import { validarPeriodoEscribible } from './periodos.service.ts'

export type EstadoMatricula = 'ACTIVA' | 'RETIRADA'

export interface MatriculaDto {
  id: string
  alumnoId: string
  alumno?: { dni: string; nombres: string; apellidos: string; codigoInstitucional: string }
  claseId: string
  periodoId: string
  registradoPor: string
  fechaRegistro: string
  estado: EstadoMatricula
  retiradoAt?: string
  observaciones?: string
}

export interface RegistrarMatriculaInput {
  alumnoId: string
  claseId: string
  periodoId: string
  observaciones?: string
}

type FilaMatriculaJoin = ReturnType<typeof acad.listarMatriculas>[number]

function aDto(f: FilaMatriculaJoin): MatriculaDto {
  return {
    id: f.matriculas.id,
    alumnoId: f.matriculas.alumnoId,
    alumno: {
      dni: f.personas.dni,
      nombres: f.personas.nombres,
      apellidos: f.personas.apellidos,
      codigoInstitucional: f.personas.codigoInstitucional,
    },
    claseId: f.matriculas.claseId,
    periodoId: f.matriculas.periodoId,
    registradoPor: f.matriculas.registradoPor,
    fechaRegistro: f.matriculas.fechaRegistro,
    estado: f.matriculas.estado as EstadoMatricula,
    retiradoAt: f.matriculas.retiradoAt ?? undefined,
    observaciones: f.matriculas.observaciones ?? undefined,
  }
}

function buscarFilaMatricula(id: string): FilaMatriculaJoin | undefined {
  return acad.listarMatriculas().find((f) => f.matriculas.id === id)
}

/**
 * Obtiene una matrícula por id (con los datos del alumno).
 */
export async function obtenerMatricula(
  matriculaId: string,
): Promise<ResultadoServicio<MatriculaDto>> {
  const fila = buscarFilaMatricula(matriculaId)
  if (!fila) {
    return fallo<MatriculaDto>('no-encontrado', `No existe una matrícula con id "${matriculaId}".`)
  }
  return exito(aDto(fila))
}

function esActiva(fila: acad.MatriculaRow): boolean {
  return fila.estado === 'ACTIVA'
}

/**
 * Registra la matrícula de un alumno en una Clase (I4, D15, N1, N3, I7).
 */
export async function registrarMatricula(
  input: RegistrarMatriculaInput,
  autor: AuthUser,
): Promise<ResultadoServicio<MatriculaDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(input.alumnoId)
  if (!alumno) {
    return fallo<MatriculaDto>('no-encontrado', `No existe un alumno con id "${input.alumnoId}".`)
  }

  const clase = acad.obtenerClasePorId(input.claseId)
  if (!clase) {
    return fallo<MatriculaDto>('no-encontrado', `No existe una clase con id "${input.claseId}".`)
  }
  if (clase.estado !== 'ABIERTA') {
    return fallo<MatriculaDto>('invalido', 'La clase no está abierta para matrículas.')
  }

  // Decisión 15: el periodo de la matrícula debe coincidir con el de la Clase.
  if (input.periodoId !== clase.periodoId) {
    return fallo<MatriculaDto>(
      'invalido',
      'El periodo indicado no coincide con el periodo de la clase.',
    )
  }

  // N10: un periodo cerrado congela las matrículas.
  const errorPeriodo = validarPeriodoEscribible(input.periodoId)
  if (errorPeriodo) return fallo<MatriculaDto>('invalido', errorPeriodo)

  const existente = acad.obtenerMatriculaActivaDeAlumno(input.alumnoId, input.periodoId)
  if (existente) {
    return fallo<MatriculaDto>(
      'invalido',
      'El alumno ya tiene una matrícula activa en este periodo.',
    )
  }

  const usadas = acad.contarVacantesUsadasDeClase(input.claseId)
  if (usadas >= clase.vacantes) {
    return fallo<MatriculaDto>('invalido', `La clase no tiene vacantes (cupo ${clase.vacantes}).`)
  }

  const id = `mat-${Date.now()}`
  acad.insertarMatricula({
    id,
    alumnoId: input.alumnoId,
    claseId: input.claseId,
    periodoId: input.periodoId,
    registradoPor: autor.id,
    fechaRegistro: new Date().toISOString(),
    estado: 'ACTIVA',
    observaciones: input.observaciones ?? null,
  })

  const creada = buscarFilaMatricula(id)
  if (!creada) return fallo<MatriculaDto>('no-disponible', 'No se pudo registrar la matrícula.')
  return exito(aDto(creada))
}

/**
 * Lista las matrículas de una clase (solo activas por defecto).
 */
export async function listarMatriculasDeClase(
  claseId: string,
  soloActivas = true,
): Promise<ResultadoServicio<MatriculaDto[]>> {
  const todas = acad
    .listarMatriculas()
    .filter((f) => f.matriculas.claseId === claseId && (soloActivas ? esActiva(f.matriculas) : true))
  const dtos = todas.map(aDto)
  return exito(dtos)
}

/**
 * N8: retira a un alumno → matrícula RETIRADA (el historial se conserva).
 */
export async function retirarMatricula(
  matriculaId: string,
): Promise<ResultadoServicio<MatriculaDto>> {
  const matricula = acad.obtenerMatriculaPorId(matriculaId)
  if (!matricula) {
    return fallo<MatriculaDto>('no-encontrado', `No existe una matrícula con id "${matriculaId}".`)
  }
  if (!esActiva(matricula)) {
    return fallo<MatriculaDto>('invalido', 'La matrícula ya no está activa.')
  }

  // N10: un periodo cerrado congela las matrículas.
  const errorPeriodo = validarPeriodoEscribible(matricula.periodoId)
  if (errorPeriodo) return fallo<MatriculaDto>('invalido', errorPeriodo)

  acad.anularMatricula(matriculaId, new Date().toISOString())
  const actualizada = buscarFilaMatricula(matriculaId)
  if (!actualizada) return fallo<MatriculaDto>('no-disponible', 'No se pudo retirar la matrícula.')
  return exito(aDto(actualizada))
}

/**
 * N9: anula (elimina) la matrícula solo si NO tiene calificaciones ni pagos asociados.
 */
export async function anularMatricula(
  matriculaId: string,
): Promise<ResultadoServicio<void>> {
  const matricula = acad.obtenerMatriculaPorId(matriculaId)
  if (!matricula) {
    return fallo<void>('no-encontrado', `No existe una matrícula con id "${matriculaId}".`)
  }

  // N10: un periodo cerrado congela las matrículas.
  const errorPeriodo = validarPeriodoEscribible(matricula.periodoId)
  if (errorPeriodo) return fallo<void>('invalido', errorPeriodo)

  const califsTrabajo = evalr.listarCalificacionesTrabajoDeAlumnoEnClase(
    matricula.claseId,
    matricula.alumnoId,
  )
  const califsExamen = evalr.listarCalificacionesExamenDeAlumnoEnClase(
    matricula.claseId,
    matricula.alumnoId,
  )
  if (califsTrabajo.length + califsExamen.length > 0) {
    return fallo<void>('invalido', 'No se puede anular: el alumno tiene calificaciones asociadas.')
  }

  const pagos = contarPagosRegistradosDeAlumno(matricula.alumnoId, matricula.periodoId)
  if (pagos > 0) {
    return fallo<void>('invalido', 'No se puede anular: el alumno tiene pagos asociados.')
  }

  acad.eliminarMatricula(matriculaId)
  return exito(undefined)
}