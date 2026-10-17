import { CalendarClock, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo'

/**
 * Banner global de año lectivo activo (P7 del plan de UX).
 * Visible en todas las pantallas autenticadas (montado en AppShell).
 * - Con año activo: franja neutra con código, nombre y badge "Activo".
 * - Sin año activo: franja ámbar de solo lectura (las escrituras están
 *   congeladas según la regla N10 del backend).
 * - Durante la carga no renderiza nada para evitar parpadeos.
 */
export function IndicadorAnioLectivo() {
  const { periodo, cargando, error } = usePeriodoActivo()

  if (cargando) return null

  if (!periodo && !error) {
    return (
      <div
        role="status"
        className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--warning)]/30 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-3.5 py-2 text-sm text-foreground"
      >
        <TriangleAlert className="size-4 shrink-0 text-[var(--warning)]" aria-hidden />
        <p className="text-balance">
          <span className="font-medium">Sin año lectivo activo.</span>{' '}
          Las escrituras (matrículas, asistencia, notas y pagos) están en solo lectura hasta que se active un año lectivo.
        </p>
      </div>
    )
  }

  // Fallo transitorio: no alarmar; el próximo ciclo reintenta (M4).
  if (!periodo && error) return null

  return (
    <div
      role="status"
      className="flex w-full flex-wrap items-center gap-2.5 rounded-lg border bg-muted/40 px-3.5 py-2 text-sm text-foreground"
    >
      <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-balance">
        <span className="font-medium">Año lectivo {periodo.codigo}</span>
        {periodo.nombre ? ` · ${periodo.nombre}` : ''}
      </p>
      <Badge variant="success" size="sm">Activo</Badge>
    </div>
  )
}
