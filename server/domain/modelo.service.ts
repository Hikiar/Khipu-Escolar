import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as evr from '../infra/repos/evaluacion.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq } from 'drizzle-orm'

export interface ModeloEvaluacionDto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface CrearModeloInput {
  codigo: string
  nombre: string
  descripcion?: string
}

export interface ActualizarModeloInput {
  nombre?: string
  descripcion?: string
  activo?: boolean
}

function aModeloDto(
  f: typeof s.modelosEvaluacion.$inferSelect,
): ModeloEvaluacionDto {
  return {
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    descripcion: f.descripcion ?? undefined,
    activo: f.activo ?? true,
  }
}

export async function listarModelos(): Promise<ResultadoServicio<ModeloEvaluacionDto[]>> {
  const filas = evr.listarModelosEvaluacion()
  return exito(filas.map(aModeloDto))
}

export async function obtenerModelo(
  id: string,
): Promise<ResultadoServicio<ModeloEvaluacionDto>> {
  const fila = evr.listarModelosEvaluacion().find((m) => m.id === id)
  if (!fila) {
    return fallo('no-encontrado', 'No existe el modelo de evaluación indicado.')
  }
  return exito(aModeloDto(fila))
}

export async function crearModelo(
  input: CrearModeloInput,
): Promise<ResultadoServicio<ModeloEvaluacionDto>> {
  const codigo = input.codigo.trim()
  if (!codigo) {
    return fallo('invalido', 'El código del modelo es obligatorio.')
  }

  const nombre = input.nombre.trim()
  if (!nombre) {
    return fallo('invalido', 'El nombre del modelo es obligatorio.')
  }

  const existente = evr.obtenerModeloEvaluacionPorCodigo(codigo)
  if (existente) {
    return fallo('invalido', 'Ya existe un modelo con ese código.')
  }

  const id = `mod-${Date.now()}`
  db.insert(s.modelosEvaluacion).values({
    id,
    codigo,
    nombre,
    descripcion: input.descripcion ?? null,
    activo: true,
  }).run()

  return obtenerModelo(id)
}

export async function actualizarModelo(
  id: string,
  patch: ActualizarModeloInput,
): Promise<ResultadoServicio<ModeloEvaluacionDto>> {
  const modelos = evr.listarModelosEvaluacion()
  const existente = modelos.find((m) => m.id === id)
  if (!existente) {
    return fallo('no-encontrado', 'No existe el modelo de evaluación indicado.')
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
  if (patch.activo !== undefined) parche.activo = patch.activo

  if (Object.keys(parche).length > 0) {
    db.update(s.modelosEvaluacion).set(parche).where(eq(s.modelosEvaluacion.id, id)).run()
  }

  return obtenerModelo(id)
}

export async function eliminarModelo(
  id: string,
): Promise<ResultadoServicio<void>> {
  const modelos = evr.listarModelosEvaluacion()
  const existente = modelos.find((m) => m.id === id)
  if (!existente) {
    return fallo('no-encontrado', 'No existe el modelo de evaluación indicado.')
  }

  const usadas = db
    .select()
    .from(s.configuracionesEvaluacionCurso)
    .where(eq(s.configuracionesEvaluacionCurso.modeloEvaluacionId, id))
    .all()

  if (usadas.length > 0) {
    return fallo('invalido', 'No se puede eliminar: el modelo está en uso por configuraciones.')
  }

  db.delete(s.modelosEvaluacion).where(eq(s.modelosEvaluacion.id, id)).run()

  return exito(undefined)
}