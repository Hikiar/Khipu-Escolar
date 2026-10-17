import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc'

interface TableSortProps {
  label: string
  active: boolean
  direction?: SortDirection
  onToggle: () => void
  className?: string
}

export function TableSort({
  label,
  active,
  direction = 'asc',
  onToggle,
  className,
}: TableSortProps) {
  const Icono = !active ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead
      aria-sort={
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      className={className}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1 font-medium transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
        <Icono className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">
          {active
            ? `Ordenado de forma ${direction === 'asc' ? 'ascendente' : 'descendente'}. Pulsa para invertir.`
            : `Ordenar por ${label.toLowerCase()}`}
        </span>
      </button>
    </TableHead>
  )
}