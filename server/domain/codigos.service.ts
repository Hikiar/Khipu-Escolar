import { db } from '../db/client.ts'
import { secuenciaCodigos } from '../db/schema.ts'
import { and, eq } from 'drizzle-orm'
import {
  CORRELATIVO_CODIGO_INSTITUCIONAL_DIGITOS,
  type CodigoInstitucionalLetra,
} from '../../shared/codigosInstitucionales.ts'

/**
 * Generación de códigos institucionales.
 *
 * Formato [LETRA][AÑO 2D][CORRELATIVO 6D] con numeración por letra y año desde la
 * tabla `secuencia_codigos` (monótona, nunca se reutiliza un correlativo). La
 * unicidad adicional la garantiza el índice único de `personas.codigoInstitucional`.
 */

function anioActual(): number {
  return new Date().getFullYear()
}

/** Siguiente correlativo de la secuencia (letra, año). Nunca retrocede ni reusa. */
function siguienteCorrelativo(letra: string, anio: number): number {
  const fila = db
    .select()
    .from(secuenciaCodigos)
    .where(and(eq(secuenciaCodigos.letra, letra), eq(secuenciaCodigos.anio, anio)))
    .get()
  const siguiente = (fila?.ultimo ?? 0) + 1
  db.insert(secuenciaCodigos)
    .values({ letra, anio, ultimo: siguiente })
    .onConflictDoUpdate({
      target: [secuenciaCodigos.letra, secuenciaCodigos.anio],
      set: { ultimo: siguiente },
    })
    .run()
  return siguiente
}

/** Construye el código a partir de letra, año y correlativo. */
export function construirCodigoInstitucional(
  letra: CodigoInstitucionalLetra,
  anio: number,
  correlativo: number,
): string {
  return (
    letra +
    String(anio).slice(-2) +
    String(correlativo).padStart(CORRELATIVO_CODIGO_INSTITUCIONAL_DIGITOS, '0')
  )
}

/** Genera el próximo código institucional de la letra dada (año en curso). */
export function generarCodigoInstitucional(letra: CodigoInstitucionalLetra): string {
  const anio = anioActual()
  return construirCodigoInstitucional(letra, anio, siguienteCorrelativo(letra, anio))
}