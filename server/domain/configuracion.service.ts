import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import * as acad from '../infra/repos/academicos.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq, inArray } from 'drizzle-orm'
import { autoCrearCompetenciasReferenciales } from './competencia.service.ts'

export interface ConfiguracionEvaluacionDto {
  id: string
  cursoId: string
  cursoCodigo: string
  cursoNombre: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  periodoId: string
  periodoCodigo: string
  periodoNombre: string
  modeloEvaluacionId: string
  modeloEvaluacionCodigo: string
  modeloEvaluacionNombre: string
  activo: boolean
}

export interface CrearConfiguracionInput {
  cursoId: string
  gradoId: string
  periodoId: string
  modeloEvaluacionId: string
}

export interface ActualizarConfiguracionInput {
  modeloEvaluacionId?: string
  activo?: boolean
}

function aConfiguracionDto(
  f: {
    configuraciones_evaluacion_curso: typeof s.configuracionesEvaluacionCurso.$inferSelect
    cursos: typeof s.cursos.$inferSelect
    grados: typeof s.grados.$inferSelect
    periodos_academicos?: typeof s.periodosAcademicos.$inferSelect
    modelos_evaluacion?: typeof s.modelosEvaluacion.$inferSelect
  },
): ConfiguracionEvaluacionDto {
  return {
    id: f.configuraciones_evaluacion_curso.id,
    cursoId: f.cursos.id,
    cursoCodigo: f.cursos.codigo,
    cursoNombre: f.cursos.nombre,
    gradoId: f.grados.id,
    gradoCodigo: f.grados.codigo,
    gradoNombre: f.grados.nombre,
    periodoId: f.configuraciones_evaluacion_curso.periodoId,
    periodoCodigo: f.periodos_academicos?.codigo ?? '',
    periodoNombre: f.periodos_academicos?.nombre ?? '',
    modeloEvaluacionId: f.configuraciones_evaluacion_curso.modeloEvaluacionId,
    modeloEvaluacionCodigo: f.modelos_evaluacion?.codigo ?? '',
    modeloEvaluacionNombre: f.modelos_evaluacion?.nombre ?? '',
    activo: f.configuraciones_evaluacion_curso.activo ?? true,
  }
}

export async function listarConfiguraciones(
  filtros?: { cursoId?: string; gradoId?: string; periodoId?: string },
): Promise<ResultadoServicio<ConfiguracionEvaluacionDto[]>> {
  let filas
  if (filtros?.periodoId) {
    filas = evr.listarConfiguracionesDePeriodo(filtros.periodoId)
  } else {
    // Sin filtro de periodo: obtener todas (sin filtrar por periodo)
    filas = evr.listarConfiguracionesDePeriodo(null)
  }

  if (filtros?.cursoId) {
    filas = filas.filter((f) => f.configuraciones_evaluacion_curso.cursoId === filtros.cursoId)
  }
  if (filtros?.gradoId) {
    filas = filas.filter((f) => f.configuraciones_evaluacion_curso.gradoId === filtros.gradoId)
  }

  return exito(filas.map(aConfiguracionDto))
}

export async function obtenerConfiguracion(
  id: string,
): Promise<ResultadoServicio<ConfiguracionEvaluacionDto>> {
  const fila = evr.obtenerConfiguracionPorId(id)
  if (!fila) {
    return fallo('no-encontrado', 'No existe la configuración indicada.')
  }

  const curso = acad.obtenerCursoPorId(fila.cursoId)
  const grado = acad.obtenerGradoPorId(fila.gradoId)
  const periodo = acad.obtenerPeriodoPorId(fila.periodoId)
  const modelos = evr.listarModelosEvaluacion()
  const modeloEncontrado = modelos.find((m) => m.id === fila.modeloEvaluacionId)

  return exito({
    id: fila.id,
    cursoId: fila.cursoId,
    cursoCodigo: curso?.codigo ?? '',
    cursoNombre: curso?.nombre ?? '',
    gradoId: fila.gradoId,
    gradoCodigo: grado?.codigo ?? '',
    gradoNombre: grado?.nombre ?? '',
    periodoId: fila.periodoId,
    periodoCodigo: periodo?.codigo ?? '',
    periodoNombre: periodo?.nombre ?? '',
    modeloEvaluacionId: fila.modeloEvaluacionId,
    modeloEvaluacionCodigo: modeloEncontrado?.codigo ?? '',
    modeloEvaluacionNombre: modeloEncontrado?.nombre ?? '',
    activo: fila.activo ?? true,
  })
}

export async function crearConfiguracion(
  input: CrearConfiguracionInput,
): Promise<ResultadoServicio<ConfiguracionEvaluacionDto>> {
  const curso = acad.obtenerCursoPorId(input.cursoId)
  if (!curso) {
    return fallo('no-encontrado', `No existe el curso "${input.cursoId}".`)
  }

  const grado = acad.obtenerGradoPorId(input.gradoId)
  if (!grado) {
    return fallo('no-encontrado', `No existe el grado "${input.gradoId}".`)
  }

  const periodo = acad.obtenerPeriodoPorId(input.periodoId)
  if (!periodo) {
    return fallo('no-encontrado', `No existe el periodo "${input.periodoId}".`)
  }

  const modelos = evr.listarModelosEvaluacion()
  const modelo = modelos.find((m) => m.id === input.modeloEvaluacionId)
  if (!modelo) {
    return fallo('no-encontrado', `No existe el modelo de evaluación "${input.modeloEvaluacionId}".`)
  }

  const existente = evr.obtenerConfiguracionEvaluacion(input.cursoId, input.gradoId, input.periodoId)
  if (existente) {
    return fallo('invalido', 'Ya existe una configuración para este curso, grado y periodo.')
  }

  const id = `cfg-${Date.now()}`
  evr.insertarConfiguracion({
    id,
    cursoId: input.cursoId,
    gradoId: input.gradoId,
    periodoId: input.periodoId,
    modeloEvaluacionId: input.modeloEvaluacionId,
    activo: true,
  })

  if (modelo.codigo === 'COMPETENCIAS') {
    autoCrearCompetenciasReferenciales(id, input.cursoId, input.gradoId)
  }

  return obtenerConfiguracion(id)
}

export async function actualizarConfiguracion(
  id: string,
  patch: ActualizarConfiguracionInput,
): Promise<ResultadoServicio<ConfiguracionEvaluacionDto>> {
  const existente = evr.obtenerConfiguracionPorId(id)
  if (!existente) {
    return fallo('no-encontrado', 'No existe la configuración indicada.')
  }

  if (patch.modeloEvaluacionId !== undefined) {
    const modelos = evr.listarModelosEvaluacion()
    const modelo = modelos.find((m) => m.id === patch.modeloEvaluacionId)
    if (!modelo) {
      return fallo('no-encontrado', `No existe el modelo de evaluación "${patch.modeloEvaluacionId}".`)
    }
    evr.actualizarModeloDeConfiguracion(id, patch.modeloEvaluacionId)
  }

  if (patch.activo !== undefined) {
    db.update(s.configuracionesEvaluacionCurso).set({ activo: patch.activo }).where(eq(s.configuracionesEvaluacionCurso.id, id)).run()
  }

  return obtenerConfiguracion(id)
}

export async function eliminarConfiguracion(
  id: string,
): Promise<ResultadoServicio<void>> {
  const existente = evr.obtenerConfiguracionPorId(id)
  if (!existente) {
    return fallo('no-encontrado', 'No existe la configuración indicada.')
  }

  const competencias = evr.listarCompetenciasDeConfiguracion(id)
  if (competencias.length > 0) {
    return fallo('invalido', 'No se puede eliminar: la configuración tiene competencias asociadas.')
  }

  const examenes = db
    .select()
    .from(s.examenesCurso)
    .where(eq(s.examenesCurso.configuracionEvaluacionCursoId, id))
    .all()
  if (examenes.length > 0) {
    return fallo('invalido', 'No se puede eliminar: la configuración tiene exámenes asociados.')
  }

  const competenciasIds = competencias.map((c) => c.id)
  if (competenciasIds.length > 0) {
    const trabajos = db
      .select()
      .from(s.trabajosEvaluacion)
      .where(inArray(s.trabajosEvaluacion.competenciaCursoId, competenciasIds))
      .all()
    if (trabajos.length > 0) {
      return fallo('invalido', 'No se puede eliminar: la configuración tiene trabajos asociados.')
    }
  }

  db.delete(s.configuracionesEvaluacionCurso).where(eq(s.configuracionesEvaluacionCurso.id, id)).run()

  return exito(undefined)
}

export async function listarConfiguracionesDeCurso(
  cursoId: string,
): Promise<ResultadoServicio<ConfiguracionEvaluacionDto[]>> {
  const filas = db
    .select()
    .from(s.configuracionesEvaluacionCurso)
    .innerJoin(s.cursos, eq(s.configuracionesEvaluacionCurso.cursoId, s.cursos.id))
    .innerJoin(s.grados, eq(s.configuracionesEvaluacionCurso.gradoId, s.grados.id))
    .innerJoin(s.periodosAcademicos, eq(s.configuracionesEvaluacionCurso.periodoId, s.periodosAcademicos.id))
    .innerJoin(s.modelosEvaluacion, eq(s.configuracionesEvaluacionCurso.modeloEvaluacionId, s.modelosEvaluacion.id))
    .where(eq(s.configuracionesEvaluacionCurso.cursoId, cursoId))
    .all()

  return exito(filas.map(aConfiguracionDto))
}