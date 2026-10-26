import type { AsignacionCurso } from '@/services/asignacionService'
import type { CursoGrado } from '@/services/cursosService'

/** Borrador local de una sección: tutor, estado, vacantes y docentes por asignatura. */
export interface BorradorSeccion {
  tutorDocenteId: string | null
  estado: string
  vacantes: number
  docentesPorCurso: Record<string, string[]>
}

export interface Cobertura {
  total: number
  conDocente: number
  pendientes: number
}

/** Datos mínimos de una clase necesarios para construir un borrador. */
export interface ClaseBase {
  tutorDocenteId?: string | null
  estado: string
  vacantes: number
}

/** Referencia estable para secciones sin acceso a asignaciones (evita bucles). */
export const ASIGNACIONES_VACIO: AsignacionCurso[] = []

export function agruparDocentesPorCurso(
  asignaciones: AsignacionCurso[],
): Record<string, string[]> {
  const mapa: Record<string, string[]> = {}
  for (const asignacion of asignaciones) {
    const lista = mapa[asignacion.cursoId] ?? []
    if (!lista.includes(asignacion.docenteId)) lista.push(asignacion.docenteId)
    mapa[asignacion.cursoId] = lista
  }
  return mapa
}

export function borradorDesde(
  clase: ClaseBase,
  asignaciones: AsignacionCurso[],
): BorradorSeccion {
  return {
    tutorDocenteId: clase.tutorDocenteId ?? null,
    estado: clase.estado,
    vacantes: clase.vacantes,
    docentesPorCurso: agruparDocentesPorCurso(asignaciones),
  }
}

function cursosConDocente(borrador: BorradorSeccion): string[] {
  return Object.keys(borrador.docentesPorCurso)
    .filter((cursoId) => (borrador.docentesPorCurso[cursoId] ?? []).length > 0)
    .sort()
}

/** Compara dos borradores ignorando el orden y las asignaturas sin docentes. */
export function iguales(a: BorradorSeccion, b: BorradorSeccion): boolean {
  if (a.tutorDocenteId !== b.tutorDocenteId) return false
  if (a.estado !== b.estado) return false
  if (a.vacantes !== b.vacantes) return false
  const cursosA = cursosConDocente(a)
  const cursosB = cursosConDocente(b)
  if (cursosA.length !== cursosB.length) return false
  for (let i = 0; i < cursosA.length; i += 1) {
    if (cursosA[i] !== cursosB[i]) return false
    const docentesA = [...(a.docentesPorCurso[cursosA[i]] ?? [])].sort()
    const docentesB = [...(b.docentesPorCurso[cursosB[i]] ?? [])].sort()
    if (docentesA.length !== docentesB.length) return false
    if (docentesA.some((docenteId, index) => docenteId !== docentesB[index])) return false
  }
  return true
}

/** Cobertura de docentes a partir de las asignaciones confirmadas por el servidor. */
export function coberturaDe(
  plan: CursoGrado[],
  asignaciones: AsignacionCurso[],
): Cobertura {
  const asignados = new Set(asignaciones.map((asignacion) => asignacion.cursoId))
  const total = plan.length
  const conDocente = plan.filter((curso) => asignados.has(curso.cursoId)).length
  return { total, conDocente, pendientes: total - conDocente }
}

/** Cobertura de docentes a partir del borrador local (modo edición). */
export function coberturaDesdeBorrador(
  plan: CursoGrado[],
  borrador: BorradorSeccion | null,
): Cobertura | null {
  if (!borrador) return null
  const total = plan.length
  const conDocente = plan.filter(
    (curso) => (borrador.docentesPorCurso[curso.cursoId] ?? []).length > 0,
  ).length
  return { total, conDocente, pendientes: total - conDocente }
}

export interface CambioAsignacion {
  tipo: 'agrega' | 'quita'
  cursoId: string
  docenteId: string
}

/** Diferencias entre el borrador confirmado y el borrador en edición. */
export interface ResumenCambios {
  tutor: boolean
  tutorAntes: string | null
  tutorDespues: string | null
  estado: boolean
  estadoAntes: string
  estadoDespues: string
  vacantes: boolean
  vacantesAntes: number
  vacantesDespues: number
  asignaciones: CambioAsignacion[]
}

export function resumenCambios(
  base: BorradorSeccion,
  borrador: BorradorSeccion,
): ResumenCambios {
  const cursoIds = new Set([
    ...Object.keys(base.docentesPorCurso),
    ...Object.keys(borrador.docentesPorCurso),
  ])
  const asignaciones: CambioAsignacion[] = []
  for (const cursoId of cursoIds) {
    const previos = base.docentesPorCurso[cursoId] ?? []
    const deseados = borrador.docentesPorCurso[cursoId] ?? []
    for (const docenteId of previos) {
      if (!deseados.includes(docenteId)) asignaciones.push({ tipo: 'quita', cursoId, docenteId })
    }
    for (const docenteId of deseados) {
      if (!previos.includes(docenteId)) asignaciones.push({ tipo: 'agrega', cursoId, docenteId })
    }
  }
  return {
    tutor: base.tutorDocenteId !== borrador.tutorDocenteId,
    tutorAntes: base.tutorDocenteId,
    tutorDespues: borrador.tutorDocenteId,
    estado: base.estado !== borrador.estado,
    estadoAntes: base.estado,
    estadoDespues: borrador.estado,
    vacantes: base.vacantes !== borrador.vacantes,
    vacantesAntes: base.vacantes,
    vacantesDespues: borrador.vacantes,
    asignaciones,
  }
}

export function tieneCambios(resumen: ResumenCambios): boolean {
  return (
    resumen.tutor ||
    resumen.estado ||
    resumen.vacantes ||
    resumen.asignaciones.length > 0
  )
}
