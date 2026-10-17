import type { TipoConcepto, MetodoPago } from '@/services/pagosService'

/** Etiquetas legibles de los tipos de concepto (fuente única de copy). */
export function etiquetaConcepto(t: TipoConcepto): string {
  if (t === 'MATRICULA') return 'Matrícula'
  if (t === 'PENSION') return 'Pensión'
  return 'Otro'
}

/** Etiquetas legibles de los métodos de pago (fuente única de copy). */
export function etiquetaMetodo(m: MetodoPago): string {
  if (m === 'EFECTIVO') return 'Efectivo'
  if (m === 'TRANSFERENCIA') return 'Transferencia'
  return 'Tarjeta'
}
