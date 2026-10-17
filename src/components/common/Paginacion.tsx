import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginacionProps {
  pagina: number
  totalPaginas: number
  total: number
  inicio: number
  fin: number
  onCambiarPagina: (pagina: number) => void
}

function paginasVisibles(pagina: number, totalPaginas: number): (number | '…')[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1)
  }
  const conjunto = new Set<number>([1, totalPaginas, pagina - 1, pagina, pagina + 1])
  const lista = [...conjunto]
    .filter((n) => n >= 1 && n <= totalPaginas)
    .sort((a, b) => a - b)
  const conElipsis: (number | '…')[] = []
  for (let i = 0; i < lista.length; i++) {
    const actual = lista[i]
    const anterior = lista[i - 1]
    if (anterior !== undefined && actual - anterior > 1) {
      conElipsis.push('…')
    }
    conElipsis.push(actual)
  }
  return conElipsis
}

/** Controles de paginación local para tablas largas. */
export function Paginacion({
  pagina,
  totalPaginas,
  total,
  inicio,
  fin,
  onCambiarPagina,
}: PaginacionProps) {
  if (total === 0) return null

  const paginas = paginasVisibles(pagina, totalPaginas)

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Mostrando {inicio + 1}–{fin} de {total}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="xs"
          onClick={() => onCambiarPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Ir a la página anterior"
        >
          <ChevronLeft className="size-3" aria-hidden />
          <span className="sr-only sm:not-sr-only">Anterior</span>
        </Button>
        <ul className="flex items-center gap-1" role="list">
          {paginas.map((valor, indice) =>
            valor === '…' ? (
              <li key={`elipsis-${indice}`} className="px-1 text-xs text-muted-foreground">
                …
              </li>
            ) : (
              <li key={valor}>
                <Button
                  variant={valor === pagina ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => onCambiarPagina(valor)}
                  aria-current={valor === pagina ? 'page' : undefined}
                  aria-label={
                    valor === pagina ? `Página actual ${valor}` : `Ir a la página ${valor}`
                  }
                  className={cn(valor !== pagina && 'text-muted-foreground')}
                >
                  {valor}
                </Button>
              </li>
            ),
          )}
        </ul>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onCambiarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Ir a la página siguiente"
        >
          <span className="sr-only sm:not-sr-only">Siguiente</span>
          <ChevronRight className="size-3" aria-hidden />
        </Button>
      </div>
    </nav>
  )
}