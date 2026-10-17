import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'
import type { Alumno } from './alumnosService'
import type { Docente } from './profesoresService'
import type { EstadoAsistencia } from './asistenciaService'
import type { ResultadoCurso } from './evaluacionService'

/// Cliente de fichas (expedientes) de alumno y docente (endpoints /api/alumnos/:id/* y /api/docentes/:id/expediente).

export interface ApoderadoExpediente {
  id: string
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  parentesco: string
  esContactoEmergencia: boolean
}

export interface MatriculaExpediente {
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

export interface ExpedienteAlumno {
  alumno: Alumno
  apoderados: ApoderadoExpediente[]
  matriculas: MatriculaExpediente[]
}

export interface RegistroAsistenciaAlumno {
  fecha: string
  claseId: string
  clase: string
  cursoId?: string
  cursoNombre?: string
  alcance: 'AULA' | 'CURSO'
  estado: EstadoAsistencia
  observaciones?: string
}

export interface ResumenAsistencia {
  presentes: number
  tardes: number
  faltas: number
  justificados: number
  total: number
}

export interface HistorialAsistenciaAlumno {
  resumen: ResumenAsistencia
  registros: RegistroAsistenciaAlumno[]
}

export interface ResultadoCursoDeAlumno {
  matricula: MatriculaExpediente | null
  resultados: Array<{
    curso: { id: string; codigo: string; nombre: string }
    resultado: ResultadoCurso
  }>
}

export interface TutoriaDocente {
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

export interface AsignacionCargaDocente {
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

export interface ExpedienteDocente {
  docente: Docente
  tutoria: TutoriaDocente[]
  asignaciones: AsignacionCargaDocente[]
}

export async function obtenerExpedienteAlumno(
  id: string,
): Promise<ResultadoServicio<ExpedienteAlumno>> {
  return apiFetch<ResultadoServicio<ExpedienteAlumno>>(`/alumnos/${encodeURIComponent(id)}/expediente`)
}

export async function obtenerHistorialAsistenciaAlumno(
  id: string,
): Promise<ResultadoServicio<HistorialAsistenciaAlumno>> {
  return apiFetch<ResultadoServicio<HistorialAsistenciaAlumno>>(
    `/alumnos/${encodeURIComponent(id)}/historial-asistencia`,
  )
}

export async function obtenerResultadosDeAlumno(
  id: string,
): Promise<ResultadoServicio<ResultadoCursoDeAlumno>> {
  return apiFetch<ResultadoServicio<ResultadoCursoDeAlumno>>(`/alumnos/${encodeURIComponent(id)}/resultados`)
}

export async function obtenerExpedienteDocente(
  id: string,
): Promise<ResultadoServicio<ExpedienteDocente>> {
  return apiFetch<ResultadoServicio<ExpedienteDocente>>(`/docentes/${encodeURIComponent(id)}/expediente`)
}