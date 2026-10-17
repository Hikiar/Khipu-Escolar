import { eq } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as rbac from '../infra/repos/rbac.ts'

/**
 * Servicio de promedios y resultados de curso (siempre derivados, N13/N14).
 * - COMPETENCIAS: el resultado por competencia es el promedio simple de sus
 *   trabajos; el resultado del curso es el promedio simple de las competencias.
 * - EXAMEN: el resultado del curso es la nota del CalificacionExamen.
 * - Nivel de logro AD/A/B/C se deriva por bandas configurables (default CNEB).
 * - Nada se almacena: todo se calcula on-demand.
 */

export interface PromedioCompetencia {
  competenciaId: string
  codigo: string
  nombre: string
  orden: number
  promedio: number | null
  nivelLogro: string | null
  trabajosCalificados: number
}

export interface ResultadoCurso {
  alumnoId: string
  alumno: { dni: string; nombres: string; apellidos: string } | null
  claseId: string
  cursoId: string
  modelo: string
  promedio: number | null
  nivelLogro: string | null
  competencias: PromedioCompetencia[]
}

/** Bandas CNEB por defecto (configurables por institución en `bandasLiteral`). */
export const BANDAS_CNEB = [
  { literal: 'AD', min: 18, max: 20 },
  { literal: 'A', min: 14, max: 17 },
  { literal: 'B', min: 11, max: 13 },
  { literal: 'C', min: 0, max: 10 },
] as const

export function derivarNivelLogro(nota: number): string {
  const b = BANDAS_CNEB.find((b) => nota >= b.min && nota <= b.max)
  return (b ?? BANDAS_CNEB[BANDAS_CNEB.length - 1]).literal
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100
}

export function obtenerCodigoModelo(modeloEvaluacionId: string): string {
  const fila = db
    .select({ codigo: s.modelosEvaluacion.codigo })
    .from(s.modelosEvaluacion)
    .where(eq(s.modelosEvaluacion.id, modeloEvaluacionId))
    .get()
  return fila?.codigo ?? 'EXAMEN'
}

function infoAlumno(alumnoId: string): { dni: string; nombres: string; apellidos: string } | null {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) return null
  const persona = rbac.obtenerPersonaPorId(alumno.personaId)
  if (!persona) return null
  return { dni: persona.dni, nombres: persona.nombres, apellidos: persona.apellidos }
}

function construirResultado(
  claseId: string,
  cursoId: string,
  alumnoId: string,
  modelo: string,
  promedio: number | null,
  competencias: PromedioCompetencia[],
): ResultadoCurso {
  return {
    alumnoId,
    alumno: infoAlumno(alumnoId),
    claseId,
    cursoId,
    modelo,
    promedio: promedio !== null ? redondear2(promedio) : null,
    nivelLogro: promedio !== null ? derivarNivelLogro(promedio) : null,
    competencias,
  }
}

/** Resultado por competencia de un alumno (N13). */
export async function calcularPromedioCompetencia(
  claseId: string,
  competenciaCursoId: string,
  alumnoId: string,
): Promise<PromedioCompetencia> {
  const competencia = evr.obtenerCompetenciaPorId(competenciaCursoId)
  const trabajos = evr
    .listarTrabajosDeClase(claseId)
    .filter((t) => t.competenciaCursoId === competenciaCursoId)

  let suma = 0
  let conteo = 0
  for (const trabajo of trabajos) {
    const calif = evr
      .listarCalificacionesDeTrabajo(trabajo.id)
      .find((c) => c.alumnoId === alumnoId)
    if (calif) {
      suma += calif.nota
      conteo++
    }
  }

  const promedio = conteo > 0 ? redondear2(suma / conteo) : null

  return {
    competenciaId: competenciaCursoId,
    codigo: competencia?.codigo ?? '?',
    nombre: competencia?.nombre ?? '?',
    orden: competencia?.orden ?? 0,
    promedio,
    nivelLogro: promedio !== null ? derivarNivelLogro(promedio) : null,
    trabajosCalificados: conteo,
  }
}

/**
 * Resultado final del curso para un alumno en una Clase (N14).
 * COMPETENCIAS → promedio de competencias; EXAMEN → nota del examen único.
 */
export async function calcularResultadoCurso(
  claseId: string,
  cursoId: string,
  alumnoId: string,
): Promise<ResultadoServicio<ResultadoCurso>> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) return fallo<ResultadoCurso>('no-encontrado', 'La clase no existe.')

  const config = evr.obtenerConfiguracionEvaluacion(cursoId, clase.gradoId, clase.periodoId)
  if (!config) {
    return fallo<ResultadoCurso>(
      'no-encontrado',
      'No hay configuración de evaluación para este (curso, grado, periodo).',
    )
  }

  const codigoModelo = obtenerCodigoModelo(config.modeloEvaluacionId)

  if (codigoModelo === 'EXAMEN') {
    const examen = evr.obtenerExamenDeClaseYConfiguracion(claseId, config.id)
    let nota: number | null = null
    if (examen) {
      const calif = evr
        .listarCalificacionesDeExamen(examen.id)
        .find((c) => c.alumnoId === alumnoId)
      nota = calif?.nota ?? null
    }
    return exito(construirResultado(claseId, cursoId, alumnoId, codigoModelo, nota, []))
  }

  // COMPETENCIAS (y PERSONALIZADO por ahora: promedio de competencias).
  const competencias = evr.listarCompetenciasDeConfiguracion(config.id).filter((c) => c.activo)
  const promedios: PromedioCompetencia[] = []
  for (const comp of competencias) {
    promedios.push(await calcularPromedioCompetencia(claseId, comp.id, alumnoId))
  }
  const conNota = promedios.filter((p) => p.promedio !== null)
  const promedioCurso =
    conNota.length > 0
      ? redondear2(conNota.reduce((acc, p) => acc + (p.promedio ?? 0), 0) / conNota.length)
      : null

  return exito(construirResultado(claseId, cursoId, alumnoId, codigoModelo, promedioCurso, promedios))
}

/**
 * Resultado del curso para TODOS los alumnos con matrícula ACTIVA de la Clase.
 */
export async function calcularResultadosDeClase(
  claseId: string,
  cursoId: string,
): Promise<ResultadoServicio<ResultadoCurso[]>> {
  const alumnos = acad.listarAlumnosDeClase(claseId)
  const resultados: ResultadoCurso[] = []
  for (const fila of alumnos) {
    const r = await calcularResultadoCurso(claseId, cursoId, fila.alumnos.personaId)
    if ('data' in r) resultados.push(r.data)
  }
  return exito(resultados)
}