import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import * as acad from '../infra/repos/academicos.ts'
import * as evr from '../infra/repos/evaluacion.ts'

/**
 * Servicio de catálogo académico de SOLO LECTURA. Expone los datos de
 * referencia (clases, alumnos, cursos, competencias, configuraciones y
 * periodo) que el frontend necesita para poblar selectores y grillas.
 * No muta nada: todas las operaciones retornan ResultadoServicio.
 */

export interface ClaseDto {
  id: string
  periodoId: string
  periodoCodigo: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  gradoOrden: number
  nivel: string
  seccionId: string
  seccionNombre: string
  turno: string
  tutorDocenteId?: string
  estado: string
  vacantes: number
}

export interface AlumnoDeClaseDto {
  id: string
  dni: string
  nombres: string
  apellidos: string
  codigoInstitucional: string
}

export interface CursoDto {
  id: string
  codigo: string
  nombre: string
  activo: boolean
}

export interface CompetenciaCursoDto {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
}

export interface ConfiguracionEvaluacionDto {
  id: string
  cursoId: string
  gradoId: string
  periodoId: string
  modeloEvaluacionId: string
  modeloCodigo: string
  activo: boolean
}

export interface PeriodoAcademicoDto {
  id: string
  codigo: string
  nombre: string
  fechaInicio?: string
  fechaFin?: string
  estado: string
}

export interface GradoDto {
  id: string
  codigo: string
  nombre: string
  nivel: string
  orden: number
}

export interface SeccionDto {
  id: string
  gradoId: string
  nombre: string
  turno: string
}

export interface DocenteDto {
  id: string
  dni: string
  nombres: string
  apellidos: string
  codigoInstitucional: string
  especialidad?: string
  titulos: { nivel: string; titulo: string }[]
  estado: string
}

type FilaClase = ReturnType<typeof acad.listarClases>[number]
type FilaAlumnoClase = ReturnType<typeof acad.listarAlumnosDeClase>[number]

function aFilaClase(f: FilaClase): ClaseDto {
  return {
    id: f.clases.id,
    periodoId: f.clases.periodoId,
    periodoCodigo: f.periodos_academicos.codigo,
    gradoId: f.clases.gradoId,
    gradoCodigo: f.grados.codigo,
    gradoNombre: f.grados.nombre,
    gradoOrden: f.grados.orden,
    nivel: f.grados.nivel,
    seccionId: f.clases.seccionId,
    seccionNombre: f.secciones.nombre,
    turno: f.secciones.turno,
    tutorDocenteId: f.clases.tutorDocenteId ?? undefined,
    estado: f.clases.estado,
    vacantes: f.clases.vacantes,
  }
}

export function listarClases(soloAbiertas = false): ResultadoServicio<ClaseDto[]> {
  const filas = acad
    .listarClases()
    .filter((f) => !soloAbiertas || f.clases.estado === 'ABIERTA')
  return exito(filas.map(aFilaClase))
}

export function listarClasesDePeriodo(periodoId: string): ResultadoServicio<ClaseDto[]> {
  const filas = acad.listarClases().filter((f) => f.clases.periodoId === periodoId)
  return exito(filas.map(aFilaClase))
}

export function listarAlumnosDeClase(claseId: string): ResultadoServicio<AlumnoDeClaseDto[]> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) {
    return fallo<AlumnoDeClaseDto[]>('no-encontrado', `No existe una clase con id "${claseId}".`)
  }
  const filas = acad.listarAlumnosDeClase(claseId)
  return exito(
    filas.map((f: FilaAlumnoClase) => ({
      id: f.alumnos.personaId,
      dni: f.personas.dni,
      nombres: f.personas.nombres,
      apellidos: f.personas.apellidos,
      codigoInstitucional: f.personas.codigoInstitucional,
    })),
  )
}

/** Cursos dictados en la Clase (AsignacionCurso), útiles para evaluar el período. */
export function listarCursosDeClase(claseId: string): ResultadoServicio<CursoDto[]> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) {
    return fallo<CursoDto[]>('no-encontrado', `No existe una clase con id "${claseId}".`)
  }
  const filas = acad.listarAsignacionesDeClase(claseId)
  return exito(
    filas.map((f) => ({
      id: f.cursos.id,
      codigo: f.cursos.codigo,
      nombre: f.cursos.nombre,
      activo: f.cursos.activo,
    })),
  )
}

/** Competencias de un curso dentro de la Clase (vía config (curso, grado, periodo)). */
export function listarCompetenciasDeClaseYCurso(
  claseId: string,
  cursoId: string,
): ResultadoServicio<CompetenciaCursoDto[]> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) {
    return fallo<CompetenciaCursoDto[]>('no-encontrado', `No existe una clase con id "${claseId}".`)
  }
  const config = evr.obtenerConfiguracionEvaluacion(cursoId, clase.gradoId, clase.periodoId)
  if (!config) {
    return fallo<CompetenciaCursoDto[]>(
      'no-encontrado',
      `No hay configuración de evaluación para el curso en la clase "${claseId}".`,
    )
  }
  const competencias = evr.listarCompetenciasDeConfiguracion(config.id).filter((c) => c.activo)
  return exito(
    competencias.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      orden: c.orden,
      activo: c.activo,
    })),
  )
}

/** Configuración de evaluación de un curso dentro de la Clase (para exámenes). */
export function listarConfiguracionDeClaseYCurso(
  claseId: string,
  cursoId: string,
): ResultadoServicio<ConfiguracionEvaluacionDto> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) {
    return fallo<ConfiguracionEvaluacionDto>(
      'no-encontrado',
      `No existe una clase con id "${claseId}".`,
    )
  }
  const config = evr.obtenerConfiguracionEvaluacion(cursoId, clase.gradoId, clase.periodoId)
  if (!config) {
    return fallo<ConfiguracionEvaluacionDto>(
      'no-encontrado',
      `No hay configuración de evaluación para el curso en la clase "${claseId}".`,
    )
  }
  const modelo = evr.listarModelosEvaluacion().find((m) => m.id === config.modeloEvaluacionId)
  return exito({
    id: config.id,
    cursoId: config.cursoId,
    gradoId: config.gradoId,
    periodoId: config.periodoId,
    modeloEvaluacionId: config.modeloEvaluacionId,
    modeloCodigo: modelo?.codigo ?? 'EXAMEN',
    activo: config.activo,
  })
}

export function listarPeriodoActivo(): ResultadoServicio<PeriodoAcademicoDto | null> {
  const periodo = acad.obtenerPeriodoActivo()[0] ?? null
  if (!periodo) return exito(null)
  return exito({
    id: periodo.id,
    codigo: periodo.codigo,
    nombre: periodo.nombre,
    fechaInicio: periodo.fechaInicio ?? undefined,
    fechaFin: periodo.fechaFin ?? undefined,
    estado: periodo.estado,
  })
}

export function listarGrados(): ResultadoServicio<GradoDto[]> {
  return exito(
    acad
      .listarGrados()
      .map((g) => ({ id: g.id, codigo: g.codigo, nombre: g.nombre, nivel: g.nivel, orden: g.orden })),
  )
}

export function listarSeccionesDeGrado(gradoId: string): ResultadoServicio<SeccionDto[]> {
  const grado = acad.obtenerGradoPorId(gradoId)
  if (!grado) {
    return fallo<SeccionDto[]>('no-encontrado', `No existe un grado con id "${gradoId}".`)
  }
  return exito(
    acad
      .listarSeccionesDeGrado(gradoId)
      .map((s) => ({ id: s.id, gradoId: s.gradoId, nombre: s.nombre, turno: s.turno })),
  )
}

export function listarDocentes(): ResultadoServicio<DocenteDto[]> {
  const niveles = new Map<string, { nivel: string; titulo: string }[]>()
  for (const f of db.select().from(s.docenteTitulos).all()) {
    const actual = niveles.get(f.docenteId) ?? []
    actual.push({ nivel: f.nivel, titulo: f.titulo })
    niveles.set(f.docenteId, actual)
  }

  const filas = db
    .select()
    .from(s.docentes)
    .innerJoin(s.personas, eq(s.docentes.personaId, s.personas.id))
    .orderBy(s.personas.apellidos, s.personas.nombres)
    .all()
  return exito(
    filas.map((f) => ({
      id: f.docentes.personaId,
      dni: f.personas.dni,
      nombres: f.personas.nombres,
      apellidos: f.personas.apellidos,
      codigoInstitucional: f.personas.codigoInstitucional,
      especialidad: f.docentes.especialidad ?? undefined,
      titulos: niveles.get(f.docentes.personaId) ?? [],
      estado: f.docentes.estado,
    })),
  )
}

/** Clases donde el docente tiene AsignacionCurso (para filtrar vista de profesor). */
export function listarClasesDeDocente(docenteId: string): ResultadoServicio<ClaseDto[]> {
  const filas = acad.listarClasesDeDocente(docenteId)
  const unicas = new Map<string, ClaseDto>()
  for (const fila of filas) {
    const dto = aFilaClase(fila)
    if (!unicas.has(dto.id)) unicas.set(dto.id, dto)
  }
  return exito([...unicas.values()])
}

/** Scope: ¿el docente dicta o es tutor de esa Clase? */
export function puedeDocenteVerClase(docenteId: string, claseId: string): boolean {
  return acad.docenteEnClase(docenteId, claseId)
}

/** Scope: ¿el alumno tiene matrícula ACTIVA en alguna Clase del docente? */
export function puedeDocenteVerAlumno(docenteId: string, alumnoId: string): boolean {
  return acad.alumnoEnClasesDeDocente(alumnoId, docenteId)
}