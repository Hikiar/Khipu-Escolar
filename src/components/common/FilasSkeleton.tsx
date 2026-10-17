import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

/**
 * Filas de skeleton para tablas (dentro de `<TableBody>`).
 * Sustituye los duplicados locales redefinidos en cada página.
 * Colocar sobre la tabla `aria-busy="true"` mientras carga.
 */
export function FilasSkeleton({ columnas = 5, filas = 4 }: { columnas?: number; filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }, (_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columnas }, (_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
