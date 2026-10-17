import { toast } from 'sonner'

/**
 * Feedback unificado (P10 del plan de UX):
 * - Éxito de mutación → `toast.success`.
 * - Error de mutación/transporte → `toast.error`.
 * Los errores de CARGA de datos usan `<ErrorState onRetry>` (no toast).
 */
export function notificarExito(accion: string, detalle?: string) {
  toast.success(accion, detalle ? { description: detalle } : undefined)
}

export function notificarError(mensaje: string) {
  toast.error(mensaje || 'No se pudo completar la acción. Intenta nuevamente.')
}
