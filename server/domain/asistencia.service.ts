import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import type { AuthUser } from '../../shared/types/auth.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as ast from '../infra/repos/asistencia.ts'
import * as rbac from '../infra/repos/rbac.ts'
import { validarPeriodoEscribible } from './periodos.service.ts'

/**
 * Servicio de asistencia diaria por Clase con DOBLE ALCANCE:
 * - AULA (cursoId = null): asistencia general del aula, la registra el tutor
 *   de la clase (clases.tutorDocenteId) o un administrador.
 * - CURSO (cursoId fijado): asistencia de un curso concreto, la registra el
 *   docente con AsignacionCurso(claseId, cursoId) o un administrador.
 * La capacidad sale de las RELACIONES del sistema, no hay reglas por nivel.
 * Reglas: N5 (tutor para AULA, AsignacionCurso para CURSO), N6 (un registro
 * por alcance: (clase, fecha) en AULA; (clase, curso, fecha) en CURSO; un
 * detalle por alumno), I5 (detalle solo para alumnos con matrícula ACTIVA),
 * I7 (registradoPor) y coherencia §13.6 (la Clase debe estar ABIERTA).
 */

export const ESTADOS_ASISTENCIA = ['PRESENTE', 'TARDE', 'FALTA', 'JUSTIFICADO'] as const
export type EstadoAsistencia = (typeof ESTADOS_ASISTENCIA)[number]

export interface DetalleAsistenciaInput {
  alumnoId: string
  estado: EstadoAsistencia
  horaEntrada?: string
  horaSalida?: string
  observaciones?: string
}

export interface RegistrarAsistenciaInput {
  claseId: string
  /** Alcance CURSO: asistencia de ese curso. Ausente/undefined = alcance AULA. */
  cursoId?: string
  fecha: string
  observaciones?: string
  detalles: DetalleAsistenciaInput[]
}

export interface ActualizarAsistenciaInput {
  observaciones?: string
  detalles: DetalleAsistenciaInput[]
}

export interface AsistenciaDetalleDto {
  id: string
  asistenciaId: string
  alumnoId: string
  estado: EstadoAsistencia
  horaEntrada?: string
  horaSalida?: string
  observaciones?: string
  alumno: { nombreCompleto: string } | null
}

export interface AsistenciaDto {
  id: string
  claseId: string
  /** Presente solo en registros de alcance CURSO. */
  cursoId?: string
  fecha: string
  registradoPor: string
  observaciones?: string
  detalles: AsistenciaDetalleDto[]
}

export interface ResumenAsistencia {
  presentes: number
  tardes: number
  faltas: number
  justificados: number
}

export interface AsistenciaResumenDto {
  id: string
  claseId: string
  /** Presente solo en registros de alcance CURSO. */
  cursoId?: string
  fecha: string
  registradoPor: string
  observaciones?: string
  resumen: ResumenAsistencia
}

export interface AlcanceCursoDto {
  id: string
  codigo: string
  nombre: string
}

/** Alcances que un usuario puede registrar en una clase. */
export interface AlcancesClaseDto {
  /** Puede registrar la asistencia general de AULA (es el tutor o admin). */
  aula: boolean
  /** Cursos donde el usuario tiene AsignacionCurso (o todos, si es admin). */
  cursos: AlcanceCursoDto[]
}

type FilaAsistencia = NonNullable<Awaited<ReturnType<typeof ast.obtenerAsistenciaPorId>>>
type FilaDetalle = Awaited<ReturnType<typeof ast.listarDetallesDeAsistencia>>[number]

/** ¿El usuario tiene el permiso total ('*') y puede operar como administrador? */
function esAdministrador(usuarioId: string): boolean {
  const permisoIds = rbac.obtenerRolesDeUsuario(usuarioId).flatMap((r) => r.permisoIds)
  return permisoIds.includes('*')
}

function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  const d = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const [y, m, dd] = fecha.split('-').map(Number)
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dd
}

function esEstadoValido(estado: string): estado is EstadoAsistencia {
  return (ESTADOS_ASISTENCIA as readonly string[]).includes(estado)
}

function nombreDeAlumno(alumnoId: string): { nombreCompleto: string } | null {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  const persona = alumno ? rbac.obtenerPersonaPorId(alumno.personaId) : null
  return persona ? { nombreCompleto: `${persona.nombres} ${persona.apellidos}` } : null
}

function aDetalleDto(f: FilaDetalle): AsistenciaDetalleDto {
  return {
    id: f.id,
    asistenciaId: f.asistenciaId,
    alumnoId: f.alumnoId,
    estado: f.estado as EstadoAsistencia,
    horaEntrada: f.horaEntrada ?? undefined,
    horaSalida: f.horaSalida ?? undefined,
    observaciones: f.observaciones ?? undefined,
    alumno: nombreDeAlumno(f.alumnoId),
  }
}

function aAsistenciaDto(
  f: FilaAsistencia,
  detalles: FilaDetalle[],
): AsistenciaDto {
  return {
    id: f.id,
    claseId: f.claseId,
    cursoId: f.cursoId ?? undefined,
    fecha: f.fecha,
    registradoPor: f.registradoPor,
    observaciones: f.observaciones ?? undefined,
    detalles: detalles.map(aDetalleDto),
  }
}

function aResumenDto(
  f: FilaAsistencia,
  detalles: FilaDetalle[],
): AsistenciaResumenDto {
  const conteo = detalles.reduce(
    (acc, d) => {
      if (d.estado === 'PRESENTE') acc.presentes += 1
      else if (d.estado === 'TARDE') acc.tardes += 1
      else if (d.estado === 'FALTA') acc.faltas += 1
      else acc.justificados += 1
      return acc
    },
    { presentes: 0, tardes: 0, faltas: 0, justificados: 0 },
  )
  return {
    id: f.id,
    claseId: f.claseId,
    cursoId: f.cursoId ?? undefined,
    fecha: f.fecha,
    registradoPor: f.registradoPor,
    observaciones: f.observaciones ?? undefined,
    resumen: conteo,
  }
}

/**
 * Valida coherencia §13.6 + reglas de integridad de la asistencia:
 * estados válidos, sin alumnos repetidos y todos con matrícula ACTIVA (I5).
 * Devuelve el mensaje de error o null si es válido.
 */
function validarDetalles(
  detalles: DetalleAsistenciaInput[],
  claseId: string,
): string | null {
  if (detalles.length === 0) return 'Debe indicar al menos un alumno.'
  const vistos = new Set<string>()
  for (const d of detalles) {
    if (!esEstadoValido(d.estado)) {
      return `El estado "${d.estado}" no es válido (PRESENTE/TARDE/FALTA/JUSTIFICADO).`
    }
    if (vistos.has(d.alumnoId)) return 'El mismo alumno está repetido en el registro.'
    vistos.add(d.alumnoId)
    if (!acad.obtenerMatriculaActivaEnClase(d.alumnoId, claseId)) {
      return `El alumno ${d.alumnoId} no tiene una matrícula activa en esta clase (I5).`
    }
  }
  return null
}

export async function registrarAsistencia(
  input: RegistrarAsistenciaInput,
  autor: AuthUser,
): Promise<ResultadoServicio<AsistenciaDto>> {
  if (!esFechaValida(input.fecha)) {
    return fallo<AsistenciaDto>('invalido', 'La fecha debe tener el formato YYYY-MM-DD y ser válida.')
  }

  const clase = acad.obtenerClasePorId(input.claseId)
  if (!clase) return fallo<AsistenciaDto>('no-encontrado', 'No existe la clase indicada.')
  if (clase.estado !== 'ABIERTA') {
    return fallo<AsistenciaDto>('invalido', 'La clase no está abierta para registrar asistencia.')
  }

  // N10: un periodo cerrado congela la asistencia.
  const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
  if (errorPeriodo) return fallo<AsistenciaDto>('invalido', errorPeriodo)

  const esAdmin = esAdministrador(autor.id)
  const alcanceCurso = input.cursoId || null

  // N5 por alcance: la capacidad fluye de las relaciones, no hay reglas por nivel.
  if (alcanceCurso) {
    if (!esAdmin && !acad.tieneAsignacionDocente(clase.id, alcanceCurso, autor.persona.id)) {
      return fallo<AsistenciaDto>(
        'invalido',
        'El docente no tiene AsignacionCurso de ese curso en esta clase (N5).',
      )
    }
    if (!acad.cursoEnPlanDeGrado(alcanceCurso, clase.gradoId)) {
      return fallo<AsistenciaDto>(
        'invalido',
        'El curso no pertenece al plan de estudios del grado de la clase.',
      )
    }
  } else if (!esAdmin && clase.tutorDocenteId !== autor.persona.id) {
    return fallo<AsistenciaDto>(
      'invalido',
      'Solo el tutor de la clase puede registrar la asistencia general del aula (N5).',
    )
  }

  // N6 por alcance: AULA → un registro por (clase, fecha); CURSO → por (clase, curso, fecha).
  const yaExiste = alcanceCurso
    ? ast.obtenerAsistenciaPorClaseCursoYFecha(clase.id, alcanceCurso, input.fecha)
    : ast.obtenerAsistenciaPorClaseYFecha(clase.id, input.fecha)
  if (yaExiste) {
    return fallo<AsistenciaDto>(
      'invalido',
      alcanceCurso
        ? 'Ya existe un registro de asistencia para esta clase, curso y fecha (N6).'
        : 'Ya existe un registro de asistencia general para esta clase y fecha (N6).',
    )
  }

  const errorDetalles = validarDetalles(input.detalles, input.claseId)
  if (errorDetalles) return fallo<AsistenciaDto>('invalido', errorDetalles)

  const id = `ast-${Date.now()}`
  ast.insertarAsistencia({
    id,
    claseId: input.claseId,
    cursoId: alcanceCurso,
    fecha: input.fecha,
    registradoPor: autor.id,
    observaciones: input.observaciones ?? null,
  })
  ast.insertarDetalles(
    input.detalles.map((d) => ({
      id: `astd-${Date.now()}-${d.alumnoId}`,
      asistenciaId: id,
      alumnoId: d.alumnoId,
      estado: d.estado,
      horaEntrada: d.horaEntrada ?? null,
      horaSalida: d.horaSalida ?? null,
      observaciones: d.observaciones ?? null,
    })),
  )

  const creada = ast.obtenerAsistenciaPorId(id)
  if (!creada) return fallo<AsistenciaDto>('no-disponible', 'No se pudo crear el registro de asistencia.')
  return exito(aAsistenciaDto(creada, ast.listarDetallesDeAsistencia(id)))
}

export async function actualizarAsistencia(
  asistenciaId: string,
  input: ActualizarAsistenciaInput,
  autor: AuthUser,
): Promise<ResultadoServicio<AsistenciaDto>> {
  const actual = ast.obtenerAsistenciaPorId(asistenciaId)
  if (!actual) {
    return fallo<AsistenciaDto>('no-encontrado', 'No existe el registro de asistencia indicado.')
  }

  const clase = acad.obtenerClasePorId(actual.claseId)
  if (!clase) return fallo<AsistenciaDto>('no-encontrado', 'No existe la clase indicada.')
  if (clase.estado !== 'ABIERTA') {
    return fallo<AsistenciaDto>('invalido', 'La clase no está abierta para modificar asistencia.')
  }

  // N10: un periodo cerrado congela la asistencia.
  const errorPeriodo = validarPeriodoEscribible(clase.periodoId)
  if (errorPeriodo) return fallo<AsistenciaDto>('invalido', errorPeriodo)

  // N5 por alcance del registro: solo el tutor (AULA) o el docente con
  // AsignacionCurso (CURSO) — o un administrador — puede modificarlo.
  const esAdmin = esAdministrador(autor.id)
  const alcanceCurso = actual.cursoId ?? null
  if (alcanceCurso) {
    if (!esAdmin && !acad.tieneAsignacionDocente(clase.id, alcanceCurso, autor.persona.id)) {
      return fallo<AsistenciaDto>(
        'invalido',
        'El docente no tiene AsignacionCurso de ese curso en esta clase (N5).',
      )
    }
  } else if (!esAdmin && clase.tutorDocenteId !== autor.persona.id) {
    return fallo<AsistenciaDto>(
      'invalido',
      'Solo el tutor de la clase puede modificar la asistencia general del aula (N5).',
    )
  }

  const errorDetalles = validarDetalles(input.detalles, actual.claseId)
  if (errorDetalles) return fallo<AsistenciaDto>('invalido', errorDetalles)

  ast.modificarAsistencia(asistenciaId, {
    observaciones: input.observaciones ?? null,
  })
  ast.eliminarDetallesDeAsistencia(asistenciaId)
  ast.insertarDetalles(
    input.detalles.map((d) => ({
      id: `astd-${Date.now()}-${d.alumnoId}`,
      asistenciaId,
      alumnoId: d.alumnoId,
      estado: d.estado,
      horaEntrada: d.horaEntrada ?? null,
      horaSalida: d.horaSalida ?? null,
      observaciones: d.observaciones ?? null,
    })),
  )

  const actualizada = ast.obtenerAsistenciaPorId(asistenciaId)
  if (!actualizada) {
    return fallo<AsistenciaDto>('no-disponible', 'No se pudo actualizar el registro de asistencia.')
  }
  return exito(aAsistenciaDto(actualizada, ast.listarDetallesDeAsistencia(asistenciaId)))
}

export async function obtenerAsistencia(
  claseId: string,
  fecha: string,
  cursoId?: string,
): Promise<ResultadoServicio<AsistenciaDto>> {
  const fila = cursoId
    ? ast.obtenerAsistenciaPorClaseCursoYFecha(claseId, cursoId, fecha)
    : ast.obtenerAsistenciaPorClaseYFecha(claseId, fecha)
  if (!fila) {
    return fallo<AsistenciaDto>('no-encontrado', 'No existe un registro de asistencia para esa clase y fecha.')
  }
  return exito(aAsistenciaDto(fila, ast.listarDetallesDeAsistencia(fila.id)))
}

export async function obtenerAsistenciaPorId(
  asistenciaId: string,
): Promise<ResultadoServicio<AsistenciaDto>> {
  const fila = ast.obtenerAsistenciaPorId(asistenciaId)
  if (!fila) {
    return fallo<AsistenciaDto>('no-encontrado', 'No existe el registro de asistencia indicado.')
  }
  return exito(aAsistenciaDto(fila, ast.listarDetallesDeAsistencia(asistenciaId)))
}

export async function listarAsistenciasDeClase(
  claseId: string,
  cursoId: string | null = null,
): Promise<ResultadoServicio<AsistenciaResumenDto[]>> {
  const filas = ast.listarAsistenciasDeClase(claseId, cursoId)
  return exito(
    filas.map((f) =>
      aResumenDto(f, ast.listarDetallesDeAsistencia(f.id)),
    ),
  )
}

/**
 * Alcances de asistencia que el usuario puede registrar en una clase:
 * `aula` (si es el tutor o admin) y `cursos` (donde tiene AsignacionCurso,
 * o todos los cursos asignados en la clase si es admin).
 */
export function listarAlcancesDeClase(
  claseId: string,
  usuarioId: string,
): ResultadoServicio<AlcancesClaseDto> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) return fallo<AlcancesClaseDto>('no-encontrado', 'No existe la clase indicada.')
  const usuario = rbac.obtenerUsuarioPorId(usuarioId)
  if (!usuario || !usuario.activo) {
    return fallo<AlcancesClaseDto>('no-encontrado', 'El usuario no existe o está inactivo.')
  }

  const esAdmin = esAdministrador(usuarioId)
  const aula = esAdmin || clase.tutorDocenteId === usuario.personaId

  const unicos = new Map<string, AlcanceCursoDto>()
  for (const a of acad.listarAsignacionesDeClase(claseId)) {
    if (!esAdmin && a.asignacion_cursos.docenteId !== usuario.personaId) continue
    unicos.set(a.cursos.id, { id: a.cursos.id, codigo: a.cursos.codigo, nombre: a.cursos.nombre })
  }

  return exito({ aula, cursos: [...unicos.values()] })
}