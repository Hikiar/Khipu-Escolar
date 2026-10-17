import { eq } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import { db } from '../db/client.ts'
import { competenciasCurso, trabajosEvaluacion } from '../db/schema.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as acad from '../infra/repos/academicos.ts'
import {
  obtenerCompetenciasDeArea,
  type NivelCurricular,
} from '../db/cneb.ts'

/**
 * Precarga las competencias referenciales del CNEB de un curso en una
 * configuración COMPETENCIAS. Idempotente: no duplica códigos existentes.
 * Devuelve el número de competencias creadas.
 */
export function autoCrearCompetenciasReferenciales(
  configId: string,
  cursoId: string,
  gradoId: string,
): number {
  const config = evr.obtenerConfiguracionPorId(configId)
  if (!config) return 0
  const curso = acad.obtenerCursoPorId(cursoId)
  const grado = acad.obtenerGradoPorId(gradoId)
  if (!curso || !grado) return 0

  const referenciales = obtenerCompetenciasDeArea(curso.codigo, grado.nivel as NivelCurricular)
  if (referenciales.length === 0) return 0

  const existentes = evr.listarCompetenciasDeConfiguracion(configId)
  const codigosExistentes = new Set(existentes.map((c) => c.codigo))

  let creadas = 0
  for (const [indice, comp] of referenciales.entries()) {
    if (codigosExistentes.has(comp.codigo)) continue
    evr.insertarCompetencia({
      id: `cmp-${configId}-${comp.codigo}`,
      configuracionEvaluacionCursoId: configId,
      codigo: comp.codigo,
      nombre: comp.nombre,
      descripcion: null,
      orden: indice + 1,
      activo: true,
    })
    creadas++
  }
  return creadas
}

export interface CompetenciaCursoDto {
  id: string
  configuracionEvaluacionCursoId: string
  codigo: string
  nombre: string
  descripcion?: string
  orden: number
  activo: boolean
}

export interface CrearCompetenciaInput {
  configuracionEvaluacionCursoId: string
  codigo: string
  nombre: string
  descripcion?: string
  orden?: number
}

export interface ActualizarCompetenciaInput {
  nombre?: string
  descripcion?: string
  orden?: number
  activo?: boolean
}

function aCompetenciaDto(
  f: Awaited<ReturnType<typeof evr.obtenerCompetenciaPorId>>,
): CompetenciaCursoDto {
  return {
    id: f.id,
    configuracionEvaluacionCursoId: f.configuracionEvaluacionCursoId,
    codigo: f.codigo,
    nombre: f.nombre,
    descripcion: f.descripcion ?? undefined,
    orden: f.orden ?? 0,
    activo: f.activo ?? true,
  }
}

export async function listarCompetenciasDeConfiguracion(
  configId: string,
): Promise<ResultadoServicio<CompetenciaCursoDto[]>> {
  const filas = evr.listarCompetenciasDeConfiguracion(configId)
  return exito(filas.map(aCompetenciaDto))
}

export async function obtenerCompetencia(
  id: string,
): Promise<ResultadoServicio<CompetenciaCursoDto>> {
  const fila = evr.obtenerCompetenciaPorId(id)
  if (!fila) {
    return fallo('no-encontrado', 'No existe la competencia indicada.')
  }
  return exito(aCompetenciaDto(fila))
}

export async function crearCompetencia(
  input: CrearCompetenciaInput,
): Promise<ResultadoServicio<CompetenciaCursoDto>> {
  const config = evr.obtenerConfiguracionPorId(input.configuracionEvaluacionCursoId)
  if (!config) {
    return fallo('no-encontrado', 'No existe la configuración de evaluación indicada.')
  }

  const codigo = input.codigo.trim()
  if (!codigo) {
    return fallo('invalido', 'El código de la competencia es obligatorio.')
  }

  const nombre = input.nombre.trim()
  if (!nombre) {
    return fallo('invalido', 'El nombre de la competencia es obligatorio.')
  }

  const existente = evr.listarCompetenciasDeConfiguracion(input.configuracionEvaluacionCursoId).find(
    (c) => c.codigo === codigo,
  )
  if (existente) {
    return fallo('invalido', 'Ya existe una competencia con ese código en esta configuración.')
  }

  const id = `cmp-${Date.now()}`
  evr.insertarCompetencia({
    id,
    configuracionEvaluacionCursoId: input.configuracionEvaluacionCursoId,
    codigo,
    nombre,
    descripcion: input.descripcion ?? null,
    orden: input.orden ?? 0,
    activo: true,
  })

  return obtenerCompetencia(id)
}

export async function actualizarCompetencia(
  id: string,
  patch: ActualizarCompetenciaInput,
): Promise<ResultadoServicio<CompetenciaCursoDto>> {
  const existente = evr.obtenerCompetenciaPorId(id)
  if (!existente) {
    return fallo('no-encontrado', 'No existe la competencia indicada.')
  }

  const parche: Record<string, unknown> = {}
  if (patch.nombre !== undefined) {
    const nombre = patch.nombre.trim()
    if (!nombre) {
      return fallo('invalido', 'El nombre no puede estar vacío.')
    }
    parche.nombre = nombre
  }
  if (patch.descripcion !== undefined) parche.descripcion = patch.descripcion
  if (patch.orden !== undefined) parche.orden = patch.orden
  if (patch.activo !== undefined) parche.activo = patch.activo

  if (Object.keys(parche).length > 0) {
    db.update(competenciasCurso).set(parche).where(eq(competenciasCurso.id, id)).run()
  }

  return obtenerCompetencia(id)
}

export async function anularCompetencia(
  id: string,
): Promise<ResultadoServicio<CompetenciaCursoDto>> {
  const existente = evr.obtenerCompetenciaPorId(id)
  if (!existente) {
    return fallo('no-encontrado', 'No existe la competencia indicada.')
  }

  const trabajos = db
    .select()
    .from(trabajosEvaluacion)
    .where(eq(trabajosEvaluacion.competenciaCursoId, id))
    .all()

  if (trabajos.length > 0) {
    return fallo('invalido', 'No se puede anular: la competencia tiene trabajos asociados.')
  }

  evr.anularCompetencia(id)

  return exito({ ...aCompetenciaDto(existente), activo: false })
}