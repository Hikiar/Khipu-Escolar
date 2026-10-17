import { and, eq } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import * as acad from '../infra/repos/academicos.ts'
import { obtenerAlumno, type AlumnoDto } from './alumnos.service.ts'
import { obtenerDocente, type DocenteDto } from './docentes.service.ts'
import { calcularResultadoCurso, type ResultadoCurso } from './promedios.service.ts'

/**
 * Servicio de "ficha" (expediente) de un alumno o docente.
 * Agrega datos dispersos del modelo en un solo contrato de SOLO LECTURA para
 * las páginas de detalle tipo perfil: datos personales, apoderados, historial
 * de matrículas, asistencia por alumno, calificaciones derivadas y carga de
 * un docente. No muta nada.
 */

type FilaPeriodo = typeof s.periodosAcademicos.$inferSelect

// ─────────────────────────── Periodos (auxiliar) ───────────────────────────

function periodosPorId(): Map<string, FilaPeriodo> {
  const mapa = new Map<string, FilaPeriodo>()
  for (const p of db.select().from(s.periodosAcademicos).all()) {
    mapa.set(p.id, p)
  }
  return mapa
}

// ─────────────────────────── Alumno: expediente ───────────────────────────

export interface ApoderadoDto {
  id: string
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  parentesco: string
  esContactoEmergencia: boolean
}

export interface MatriculaExpedienteDto {
  id: string
  periodoId: string
  periodoCodigo: string
  periodoNombre: string
  periodoEstado: string
  claseId: string
  gradoCodigo: string
  gradoNombre: string
  nivel: string
  seccionNombre: string
  turno: string
  estado: 'ACTIVA' | 'RETIRADA'
  fechaRegistro: string
  retiradoAt?: string
  observaciones?: string
}

export interface ExpedienteAlumnoDto {
  alumno: AlumnoDto
  apoderados: ApoderadoDto[]
  matriculas: MatriculaExpedienteDto[]
}

type FilaMatricula = ReturnType<typeof acad.listarMatriculas>[number]

function aMatriculaExpedienteDto(f: FilaMatricula, periodo?: FilaPeriodo): MatriculaExpedienteDto {
  return {
    id: f.matriculas.id,
    periodoId: f.matriculas.periodoId,
    periodoCodigo: periodo?.codigo ?? '',
    periodoNombre: periodo?.nombre ?? '',
    periodoEstado: periodo?.estado ?? 'PLANIFICADO',
    claseId: f.matriculas.claseId,
    gradoCodigo: f.grados.codigo,
    gradoNombre: f.grados.nombre,
    nivel: f.grados.nivel,
    seccionNombre: f.secciones.nombre,
    turno: f.secciones.turno,
    estado: f.matriculas.estado as 'ACTIVA' | 'RETIRADA',
    fechaRegistro: f.matriculas.fechaRegistro,
    retiradoAt: f.matriculas.retiradoAt ?? undefined,
    observaciones: f.matriculas.observaciones ?? undefined,
  }
}

function listarApoderadosDeAlumno(alumnoId: string): ApoderadoDto[] {
  return db
    .select()
    .from(s.alumnoApoderados)
    .innerJoin(s.apoderados, eq(s.alumnoApoderados.apoderadoId, s.apoderados.personaId))
    .innerJoin(s.personas, eq(s.apoderados.personaId, s.personas.id))
    .where(eq(s.alumnoApoderados.alumnoId, alumnoId))
    .orderBy(s.alumnoApoderados.prioridad)
    .all()
    .map((f) => ({
      id: f.personas.id,
      dni: f.personas.dni,
      nombres: f.personas.nombres,
      apellidos: f.personas.apellidos,
      correo: f.personas.correo ?? undefined,
      telefono: f.personas.telefono ?? undefined,
      parentesco: f.alumno_apoderados.parentesco ?? f.apoderados.parentesco,
      esContactoEmergencia: f.apoderados.esContactoEmergencia,
    }))
}

/** Ficha de un alumno: datos, apoderados e historial de matrículas. */
export async function obtenerExpedienteAlumno(
  alumnoId: string,
): Promise<ResultadoServicio<ExpedienteAlumnoDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) {
    return fallo<ExpedienteAlumnoDto>(
      'no-encontrado',
      `No existe un alumno con id "${alumnoId}".`,
    )
  }

  const resultadoAlumno = await obtenerAlumno(alumnoId)
  if ('error' in resultadoAlumno) {
    return fallo<ExpedienteAlumnoDto>('no-encontrado', resultadoAlumno.error)
  }

  const periodos = periodosPorId()
  const matriculas = acad
    .listarMatriculas()
    .filter((f) => f.matriculas.alumnoId === alumnoId)
    .sort((a, b) => (b.matriculas.fechaRegistro < a.matriculas.fechaRegistro ? -1 : 1))
    .map((f) => aMatriculaExpedienteDto(f, periodos.get(f.matriculas.periodoId)))

  return exito({
    alumno: resultadoAlumno.data,
    apoderados: listarApoderadosDeAlumno(alumnoId),
    matriculas,
  })
}

// ─────────────────────────── Alumno: asistencia ───────────────────────────

export interface RegistroAsistenciaAlumnoDto {
  fecha: string
  claseId: string
  clase: string
  cursoId?: string
  cursoNombre?: string
  alcance: 'AULA' | 'CURSO'
  estado: string
  observaciones?: string
}

export interface ResumenAsistenciaDto {
  presentes: number
  tardes: number
  faltas: number
  justificados: number
  total: number
}

export interface HistorialAsistenciaAlumnoDto {
  resumen: ResumenAsistenciaDto
  registros: RegistroAsistenciaAlumnoDto[]
}

/** Asistencias registradas de un alumno (aula y por curso), de más reciente a más antigua. */
export async function historicoAsistenciaAlumno(
  alumnoId: string,
): Promise<ResultadoServicio<HistorialAsistenciaAlumnoDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) {
    return fallo<HistorialAsistenciaAlumnoDto>(
      'no-encontrado',
      `No existe un alumno con id "${alumnoId}".`,
    )
  }

  const clases = new Map<string, string>()
  for (const f of acad.listarClases()) {
    clases.set(f.clases.id, `${f.grados.nombre} · ${f.secciones.nombre}`)
  }
  const cursos = new Map<string, string>()
  for (const c of db.select().from(s.cursos).all()) {
    cursos.set(c.id, c.nombre)
  }

  const filas = db
    .select()
    .from(s.asistenciaDetalles)
    .innerJoin(s.asistencias, eq(s.asistenciaDetalles.asistenciaId, s.asistencias.id))
    .where(eq(s.asistenciaDetalles.alumnoId, alumnoId))
    .all()

  const registros: RegistroAsistenciaAlumnoDto[] = filas.map((f) => ({
    fecha: f.asistencias.fecha,
    claseId: f.asistencias.claseId,
    clase: clases.get(f.asistencias.claseId) ?? f.asistencias.claseId,
    cursoId: f.asistencias.cursoId ?? undefined,
    cursoNombre: f.asistencias.cursoId
      ? cursos.get(f.asistencias.cursoId) ?? undefined
      : undefined,
    alcance: f.asistencias.cursoId ? 'CURSO' : 'AULA',
    estado: f.asistencia_detalles.estado,
    observaciones: f.asistencia_detalles.observaciones ?? undefined,
  }))
  registros.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  const conteo = (estado: string) => registros.filter((r) => r.estado === estado).length
  const resumen: ResumenAsistenciaDto = {
    presentes: conteo('PRESENTE'),
    tardes: conteo('TARDE'),
    faltas: conteo('FALTA'),
    justificados: conteo('JUSTIFICADO'),
    total: registros.length,
  }

  return exito({ resumen, registros })
}

// ─────────────────────────── Alumno: calificaciones ───────────────────────────

export interface ResultadoCursoAlumnoDto {
  matricula: MatriculaExpedienteDto | null
  resultados: Array<{
    curso: { id: string; codigo: string; nombre: string }
    resultado: ResultadoCurso
  }>
}

/**
 * Calificaciones derivadas de la matrícula ACTIVA del alumno, curso por curso.
 * Prefiere la matrícula del periodo ACTIVO; si no existe, la más reciente.
 */
export async function resultadosDeAlumno(
  alumnoId: string,
): Promise<ResultadoServicio<ResultadoCursoAlumnoDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) {
    return fallo<ResultadoCursoAlumnoDto>(
      'no-encontrado',
      `No existe un alumno con id "${alumnoId}".`,
    )
  }

  const periodos = periodosPorId()
  const activas = acad
    .listarMatriculas()
    .filter((f) => f.matriculas.alumnoId === alumnoId && f.matriculas.estado === 'ACTIVA')
  if (activas.length === 0) {
    return exito({ matricula: null, resultados: [] })
  }

  const enPeriodoActivo = activas.find(
    (f) => periodos.get(f.matriculas.periodoId)?.estado === 'ACTIVO',
  )
  const objetivo = enPeriodoActivo ?? activas[0]
  const matricula = aMatriculaExpedienteDto(objetivo, periodos.get(objetivo.matriculas.periodoId))

  const asignaciones = acad.listarAsignacionesDeClase(objetivo.matriculas.claseId)
  const resultados: ResultadoCursoAlumnoDto['resultados'] = []
  for (const a of asignaciones) {
    const r = await calcularResultadoCurso(objetivo.matriculas.claseId, a.cursos.id, alumnoId)
    if ('data' in r) {
      resultados.push({
        curso: { id: a.cursos.id, codigo: a.cursos.codigo, nombre: a.cursos.nombre },
        resultado: r.data,
      })
    }
  }

  return exito({ matricula, resultados })
}

// ─────────────────────────── Docente: expediente ───────────────────────────

export interface AsignacionCargaDto {
  claseId: string
  claseNombre: string
  turno: string
  periodoId: string
  periodoCodigo: string
  periodoNombre: string
  nivel: string
  cursoId: string
  cursoCodigo: string
  cursoNombre: string
  horasSemana: number | null
}

export interface ClaseTutoriaDto {
  id: string
  periodoId: string
  periodoCodigo: string
  periodoNombre: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  nivel: string
  seccionId: string
  seccionNombre: string
  turno: string
  estado: string
  vacantes: number
}

export interface ExpedienteDocenteDto {
  docente: DocenteDto
  tutoria: ClaseTutoriaDto[]
  asignaciones: AsignacionCargaDto[]
}

/** Ficha de un docente: datos, tutoría (grupos a cargo) y carga horaria. */
export async function obtenerExpedienteDocente(
  docenteId: string,
): Promise<ResultadoServicio<ExpedienteDocenteDto>> {
  const resultadoDocente = await obtenerDocente(docenteId)
  if ('error' in resultadoDocente) {
    return fallo<ExpedienteDocenteDto>('no-encontrado', resultadoDocente.error)
  }

  const tutoria = db
    .select()
    .from(s.clases)
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .where(eq(s.clases.tutorDocenteId, docenteId))
    .orderBy(s.periodosAcademicos.nombre, s.grados.orden, s.secciones.nombre)
    .all()
    .map(
      (f): ClaseTutoriaDto => ({
        id: f.clases.id,
        periodoId: f.clases.periodoId,
        periodoCodigo: f.periodos_academicos.codigo,
        periodoNombre: f.periodos_academicos.nombre,
        gradoId: f.clases.gradoId,
        gradoCodigo: f.grados.codigo,
        gradoNombre: f.grados.nombre,
        nivel: f.grados.nivel,
        seccionId: f.clases.seccionId,
        seccionNombre: f.secciones.nombre,
        turno: f.secciones.turno,
        estado: f.clases.estado,
        vacantes: f.clases.vacantes,
      }),
    )

  const asignaciones = db
    .select()
    .from(s.asignacionCursos)
    .innerJoin(s.cursos, eq(s.asignacionCursos.cursoId, s.cursos.id))
    .innerJoin(s.clases, eq(s.asignacionCursos.claseId, s.clases.id))
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .leftJoin(
      s.cursoGrados,
      and(
        eq(s.cursoGrados.cursoId, s.asignacionCursos.cursoId),
        eq(s.cursoGrados.gradoId, s.clases.gradoId),
      ),
    )
    .where(eq(s.asignacionCursos.docenteId, docenteId))
    .orderBy(s.periodosAcademicos.nombre, s.grados.orden, s.secciones.nombre, s.cursos.nombre)
    .all()
    .map(
      (f): AsignacionCargaDto => ({
        claseId: f.clases.id,
        claseNombre: `${f.grados.nombre} · ${f.secciones.nombre}`,
        turno: f.secciones.turno,
        periodoId: f.clases.periodoId,
        periodoCodigo: f.periodos_academicos.codigo,
        periodoNombre: f.periodos_academicos.nombre,
        nivel: f.grados.nivel,
        cursoId: f.cursos.id,
        cursoCodigo: f.cursos.codigo,
        cursoNombre: f.cursos.nombre,
        horasSemana: f.curso_grados?.horasSemana ?? null,
      }),
    )

  return exito({
    docente: resultadoDocente.data,
    tutoria,
    asignaciones,
  })
}