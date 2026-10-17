import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real del catálogo académico de solo lectura (endpoints /api/catalogo...).
/// DTO espejo de `server/domain/catalogo.service.ts` (mismos campos).

export interface Clase {
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

export interface Alumno {
  id: string
  dni: string
  nombres: string
  apellidos: string
  codigoInstitucional: string
  estado: string
}

export interface AlumnoDeClase {
  id: string
  dni: string
  nombres: string
  apellidos: string
  codigoInstitucional: string
}

export interface Curso {
  id: string
  codigo: string
  nombre: string
  activo: boolean
}

export interface CompetenciaCurso {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
}

export interface ConfiguracionEvaluacion {
  id: string
  cursoId: string
  gradoId: string
  periodoId: string
  modeloEvaluacionId: string
  modeloCodigo: string
  activo: boolean
}

export interface PeriodoAcademico {
  id: string
  codigo: string
  nombre: string
  fechaInicio?: string
  fechaFin?: string
  estado: string
}

export interface Grado {
  id: string
  codigo: string
  nombre: string
  nivel: string
  orden: number
}

export interface Seccion {
  id: string
  gradoId: string
  nombre: string
  turno: string
}

export interface Docente {
  id: string
  dni: string
  nombres: string
  apellidos: string
  codigoInstitucional: string
  especialidad?: string
  titulos: { nivel: string; titulo: string }[]
  estado: string
  niveles: string[]
}

export interface ModeloEvaluacion {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export async function listarClases(
  soloAbiertas = false,
): Promise<ResultadoServicio<Clase[]>> {
  const sufijo = soloAbiertas ? '?abiertas=1' : ''
  return apiFetch<ResultadoServicio<Clase[]>>(`/clases${sufijo}`)
}

export async function listarClasesAbiertas(): Promise<ResultadoServicio<Clase[]>> {
  return listarClases(true)
}

export async function listarAlumnos(): Promise<ResultadoServicio<Alumno[]>> {
  return apiFetch<ResultadoServicio<Alumno[]>>('/alumnos')
}

export async function listarAlumnosDeClase(
  claseId: string,
): Promise<ResultadoServicio<AlumnoDeClase[]>> {
  return apiFetch<ResultadoServicio<AlumnoDeClase[]>>(`/clases/${claseId}/alumnos`)
}

export async function listarCursosDeClase(
  claseId: string,
): Promise<ResultadoServicio<Curso[]>> {
  return apiFetch<ResultadoServicio<Curso[]>>(`/clases/${claseId}/cursos`)
}

export async function listarCompetenciasDeClaseYCurso(
  claseId: string,
  cursoId: string,
): Promise<ResultadoServicio<CompetenciaCurso[]>> {
  return apiFetch<ResultadoServicio<CompetenciaCurso[]>>(
    `/clases/${claseId}/competencias?cursoId=${encodeURIComponent(cursoId)}`,
  )
}

export async function listarConfiguracionDeClaseYCurso(
  claseId: string,
  cursoId: string,
): Promise<ResultadoServicio<ConfiguracionEvaluacion>> {
  return apiFetch<ResultadoServicio<ConfiguracionEvaluacion>>(
    `/clases/${claseId}/configuracion?cursoId=${encodeURIComponent(cursoId)}`,
  )
}

export async function listarPeriodoActivo(): Promise<
  ResultadoServicio<PeriodoAcademico | null>
> {
  return apiFetch<ResultadoServicio<PeriodoAcademico | null>>('/periodo-activo')
}

export async function listarGrados(): Promise<ResultadoServicio<Grado[]>> {
  return apiFetch<ResultadoServicio<Grado[]>>('/grados')
}

export async function listarSeccionesDeGrado(
  gradoId: string,
): Promise<ResultadoServicio<Seccion[]>> {
  return apiFetch<ResultadoServicio<Seccion[]>>(`/grados/${gradoId}/secciones`)
}

export async function listarCursos(): Promise<ResultadoServicio<Curso[]>> {
  return apiFetch<ResultadoServicio<Curso[]>>('/cursos')
}

export async function listarDocentes(): Promise<ResultadoServicio<Docente[]>> {
  return apiFetch<ResultadoServicio<Docente[]>>('/docentes')
}

export async function listarClasesDeDocente(
  docenteId: string,
): Promise<ResultadoServicio<Clase[]>> {
  return apiFetch<ResultadoServicio<Clase[]>>(`/clases?docenteId=${encodeURIComponent(docenteId)}`)
}

export async function listarModelosEvaluacion(): Promise<ResultadoServicio<ModeloEvaluacion[]>> {
  return apiFetch<ResultadoServicio<ModeloEvaluacion[]>>('/modelos')
}