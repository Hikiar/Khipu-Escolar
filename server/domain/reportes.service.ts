import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as ast from '../infra/repos/asistencia.ts'
import * as pgr from '../infra/repos/pagos.ts'
import { derivarNivelLogro, obtenerCodigoModelo } from './promedios.service.ts'


/**
 * Servicio de reportes agregados.
 * Reutiliza repositories y services existentes; NO duplica lógica de negocio.
 * Todos los endpoints son de solo lectura (GET).
 */

// ─────────────────────────── Tipos de respuesta ───────────────────────────

export interface ResumenMatriculas {
  totalAlumnos: number
  activos: number
  inactivos: number
  porGrado: { gradoId: string; gradoNombre: string; total: number }[]
  porClase: { claseId: string; gradoNombre: string; seccionNombre: string; total: number; vacantes: number }[]
}

export interface ResumenAsistencia {
  totalRegistros: number
  porEstado: { presentes: number; tardes: number; faltas: number; justificados: number }
  porClase: { claseId: string; fecha: string; presentes: number; tardes: number; faltas: number; justificados: number }[]
}

export interface ResumenEvaluacion {
  totalTrabajos: number
  totalExamenes: number
  totalCalificaciones: number
  promedioGeneral: number | null
  porClaseCurso: { claseId: string; cursoId: string; modelo: string; promedio: number | null; nivelLogro: string | null; alumnos: number }[]
}

export interface ResumenPagos {
  totalConceptos: number
  totalPagos: number
  montoTotal: number
  porEstado: { REGISTRADO: number; ANULADO: number }
  porConcepto: { conceptoId: string; codigo: string; descripcion: string; montoBase: number; pagados: number; montoRecaudado: number }[]
}

export interface ResumenAlumnos {
  total: number
  porEstado: { ACTIVO: number; INACTIVO: number }
  porGrado: { gradoId: string; gradoNombre: string; total: number }[]
}

// ─────────────────────────── Reportes ───────────────────────────

/** Reporte de matrículas por periodo (default: periodo activo) */
export async function reporteMatriculas(
  periodoId?: string,
): Promise<ResultadoServicio<ResumenMatriculas>> {
  const periodo = periodoId ?? acad.obtenerPeriodoActivo()[0]?.id
  if (!periodo) {
    return fallo<ResumenMatriculas>('no-encontrado', 'No hay periodo académico indicado ni activo.')
  }

  const matriculas = acad.listarMatriculas().filter(m => m.matriculas.periodoId === periodo && m.matriculas.estado === 'ACTIVA')

  const alumnosDelPeriodo = new Map<string, boolean>()
  for (const m of matriculas) {
    alumnosDelPeriodo.set(m.matriculas.alumnoId, true)
  }
  const totalAlumnos = alumnosDelPeriodo.size
  let activos = 0
  for (const alumnoId of alumnosDelPeriodo.keys()) {
    const al = acad.obtenerAlumnoPorPersonaId(alumnoId)
    if (al && al.estado === 'ACTIVO') activos++
  }
  const inactivos = totalAlumnos - activos

  const porGradoMap = new Map<string, { gradoId: string; gradoNombre: string; total: number }>()
  for (const m of matriculas) {
    const clase = acad.obtenerClasePorId(m.matriculas.claseId)
    if (clase) {
      const grado = acad.obtenerGradoPorId(clase.gradoId)
      const key = grado?.id ?? 'sin-grado'
      const entry = porGradoMap.get(key) ?? { gradoId: key, gradoNombre: grado?.nombre ?? 'Sin grado', total: 0 }
      entry.total++
      porGradoMap.set(key, entry)
    }
  }

  const porClaseMap = new Map<string, { claseId: string; gradoNombre: string; seccionNombre: string; total: number; vacantes: number }>()
  for (const m of matriculas) {
    const clase = acad.obtenerClasePorId(m.matriculas.claseId)
    if (clase) {
      const grado = acad.obtenerGradoPorId(clase.gradoId)
      const seccion = db.select().from(s.secciones).where(eq(s.secciones.id, clase.seccionId)).get()
      const key = clase.id
      const entry = porClaseMap.get(key) ?? {
        claseId: key,
        gradoNombre: grado?.nombre ?? '—',
        seccionNombre: seccion?.nombre ?? '—',
        total: 0,
        vacantes: clase.vacantes,
      }
      entry.total++
      porClaseMap.set(key, entry)
    }
  }

  return exito({
    totalAlumnos,
    activos,
    inactivos,
    porGrado: Array.from(porGradoMap.values()),
    porClase: Array.from(porClaseMap.values()),
  })
}

/** Reporte de asistencia por clase/curso y rango de fechas */
export async function reporteAsistencia(
  claseId?: string,
  cursoId?: string,
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<ResultadoServicio<ResumenAsistencia>> {
  const asistencias = claseId
    ? ast.listarAsistenciasDeClase(claseId, cursoId ?? null)
    : db
        .select()
        .from(s.asistencias)
        .all()
        .filter((a) => !cursoId || a.cursoId === cursoId)

  let filtradas = asistencias
  if (fechaDesde) filtradas = filtradas.filter(a => a.fecha >= fechaDesde)
  if (fechaHasta) filtradas = filtradas.filter(a => a.fecha <= fechaHasta)

  const porEstado = { presentes: 0, tardes: 0, faltas: 0, justificados: 0 }
  const porClase: ResumenAsistencia['porClase'] = []

  for (const a of filtradas) {
    const detalles = ast.listarDetallesDeAsistencia(a.id)
    const resumen = { presentes: 0, tardes: 0, faltas: 0, justificados: 0 }
    for (const d of detalles) {
      if (d.estado === 'PRESENTE') { porEstado.presentes++; resumen.presentes++ }
      else if (d.estado === 'TARDE') { porEstado.tardes++; resumen.tardes++ }
      else if (d.estado === 'FALTA') { porEstado.faltas++; resumen.faltas++ }
      else if (d.estado === 'JUSTIFICADO') { porEstado.justificados++; resumen.justificados++ }
    }
    if (!claseId) {
      porClase.push({
        claseId: a.claseId,
        fecha: a.fecha,
        ...resumen,
      })
    }
  }

  return exito({
    totalRegistros: filtradas.length,
    porEstado,
    porClase: claseId ? [] : porClase,
  })
}

/** Reporte de evaluación (promedios y resultados) por clase y curso */
export async function reporteEvaluacion(
  claseId?: string,
  cursoId?: string,
): Promise<ResultadoServicio<ResumenEvaluacion>> {
  const clases = claseId ? [acad.obtenerClasePorId(claseId)].filter(Boolean) : acad.listarClases().map(c => c.clases)

  let totalTrabajos = 0
  let totalExamenes = 0
  let totalCalificaciones = 0
  const sumas = new Map<string, { suma: number; count: number }>()
  const porClaseCurso: ResumenEvaluacion['porClaseCurso'] = []

  for (const c of clases) {
    const cursos = cursoId
      ? [acad.obtenerCursoPorId(cursoId)].filter(Boolean)
      : acad.listarAsignacionesDeClase(c.id).map(a => a.cursos)

    // Un solo escaneo por clase: trabajos y exámenes se agrupan por curso vía su configuración.
    const trabajosDeClase = evr.listarTrabajosDeClase(c.id)
    const examenesDeClase = evr.listarExamenesDeClase(c.id)

    for (const curso of cursos) {
      const config = evr.obtenerConfiguracionEvaluacion(curso.id, c.gradoId, c.periodoId)
      const modelo = config ? obtenerCodigoModelo(config.modeloEvaluacionId) : 'SIN_CONFIG'

      const competenciasDeConfig = config
        ? new Set(evr.listarCompetenciasDeConfiguracion(config.id).map(comp => comp.id))
        : new Set<string>()

      const trabajosDelCurso = trabajosDeClase.filter((t) => competenciasDeConfig.has(t.competenciaCursoId))
      const examenesDelCurso = examenesDeClase.filter((e) => e.configuracionEvaluacionCursoId === config?.id)

      totalTrabajos += trabajosDelCurso.length
      totalExamenes += examenesDelCurso.length

      for (const t of trabajosDelCurso) {
        const califs = evr.listarCalificacionesDeTrabajo(t.id)
        totalCalificaciones += califs.length
        for (const cal of califs) {
          const key = `${c.id}-${curso.id}`
          const entry = sumas.get(key) ?? { suma: 0, count: 0 }
          entry.suma += cal.nota
          entry.count++
          sumas.set(key, entry)
        }
      }
      for (const e of examenesDelCurso) {
        const califs = evr.listarCalificacionesDeExamen(e.id)
        totalCalificaciones += califs.length
        for (const cal of califs) {
          const key = `${c.id}-${curso.id}`
          const entry = sumas.get(key) ?? { suma: 0, count: 0 }
          entry.suma += cal.nota
          entry.count++
          sumas.set(key, entry)
        }
      }

      const key = `${c.id}-${curso.id}`
      const acc = sumas.get(key)
      const promedio = acc && acc.count > 0 ? Math.round((acc.suma / acc.count) * 100) / 100 : null
      const nivel = promedio !== null ? derivarNivelLogro(promedio) : null
      porClaseCurso.push({
        claseId: c.id,
        cursoId: curso.id,
        modelo,
        promedio,
        nivelLogro: nivel,
        alumnos: acad.listarAlumnosDeClase(c.id).length,
      })
    }
  }

  const allSumas = Array.from(sumas.values()).reduce((acc, v) => ({ suma: acc.suma + v.suma, count: acc.count + v.count }), { suma: 0, count: 0 })
  const promedioGeneral = allSumas.count > 0 ? Math.round((allSumas.suma / allSumas.count) * 100) / 100 : null

  return exito({
    totalTrabajos,
    totalExamenes,
    totalCalificaciones,
    promedioGeneral,
    porClaseCurso,
  })
}

/** Reporte de pagos por periodo */
export async function reportePagos(
  periodoId?: string,
): Promise<ResultadoServicio<ResumenPagos>> {
  const periodo = periodoId ?? acad.obtenerPeriodoActivo()[0]?.id
  if (!periodo) {
    return fallo<ResumenPagos>('no-encontrado', 'No hay periodo académico indicado ni activo.')
  }

  const conceptos = pgr.listarConceptosDePeriodo(periodo)
  const totalConceptos = conceptos.length

  const allPagos = db.select().from(s.pagos)
    .innerJoin(s.conceptosPago, eq(s.pagos.conceptoId, s.conceptosPago.id))
    .where(eq(s.conceptosPago.periodoId, periodo))
    .all()

  const porEstado = { REGISTRADO: 0, ANULADO: 0 }
  let montoTotal = 0

  const porConceptoMap = new Map<string, { conceptoId: string; codigo: string; descripcion: string; montoBase: number; pagados: number; montoRecaudado: number }>()

  for (const c of conceptos) {
    porConceptoMap.set(c.id, {
      conceptoId: c.id,
      codigo: c.codigo,
      descripcion: c.descripcion,
      montoBase: c.montoBase,
      pagados: 0,
      montoRecaudado: 0,
    })
  }

  for (const p of allPagos) {
    const pago = p.pagos
    const concepto = p.conceptos_pago
    if (pago.estado === 'REGISTRADO') {
      porEstado.REGISTRADO++
      montoTotal += pago.monto
    } else {
      porEstado.ANULADO++
    }
    const entry = porConceptoMap.get(concepto.id)
    if (entry && pago.estado === 'REGISTRADO') {
      entry.pagados++
      entry.montoRecaudado += pago.monto
    }
  }

  return exito({
    totalConceptos,
    totalPagos: allPagos.length,
    montoTotal: Math.round(montoTotal * 100) / 100,
    porEstado,
    porConcepto: Array.from(porConceptoMap.values()),
  })
}

/** Reporte general de alumnos */
export async function reporteAlumnos(): Promise<ResultadoServicio<ResumenAlumnos>> {
  const alumnos = acad.listarAlumnos()
  const total = alumnos.length
  const porEstado = { ACTIVO: 0, INACTIVO: 0 }
  const porGradoMap = new Map<string, { gradoId: string; gradoNombre: string; total: number }>()

  for (const a of alumnos) {
    if (a.alumnos.estado === 'ACTIVO') {
      porEstado.ACTIVO++
    } else {
      porEstado.INACTIVO++
    }

    const matriculas = acad.listarMatriculas().filter(m => m.matriculas.alumnoId === a.alumnos.personaId && m.matriculas.estado === 'ACTIVA')
    for (const m of matriculas) {
      const clase = acad.obtenerClasePorId(m.matriculas.claseId)
      if (clase) {
        const grado = acad.obtenerGradoPorId(clase.gradoId)
        const key = grado?.id ?? 'sin-grado'
        const entry = porGradoMap.get(key) ?? { gradoId: key, gradoNombre: grado?.nombre ?? 'Sin grado', total: 0 }
        entry.total++
        porGradoMap.set(key, entry)
      }
    }
  }

  return exito({
    total,
    porEstado,
    porGrado: Array.from(porGradoMap.values()),
  })
}