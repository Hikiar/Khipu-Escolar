import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableSort } from "./TableSort"
import type { SortDirection } from "./TableSort"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
  sortable?: boolean
  sortValue?: (item: T) => string | number
}

interface TableResponsiveProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  striped?: boolean
  hoverable?: boolean
}

interface Orden {
  key: string
  direccion: SortDirection
}

function comparar(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "es", { sensitivity: "base" })
}

export function TableResponsive<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No hay datos disponibles",
  emptyAction,
  className,
  striped = true,
  hoverable = true,
}: TableResponsiveProps<T>) {
  const [orden, setOrden] = useState<Orden | null>(null)
  const visibleColumns = columns.filter((c) => !c.hideOnMobile)

  const columnasOrdenables = columns.filter((c) => c.sortable)
  const habilitarOrden = columnasOrdenables.length > 0

  const datos = useMemo(() => {
    if (!habilitarOrden || !orden) return data
    const columna = columns.find((c) => c.key === orden.key)
    if (!columna?.sortValue) return data
    const copia = [...data]
    const factor = orden.direccion === "asc" ? 1 : -1
    copia.sort((a, b) => comparar(columna.sortValue!(a), columna.sortValue!(b)) * factor)
    return copia
  }, [data, columns, habilitarOrden, orden])

  function cambiarOrden(key: string) {
    setOrden((prev) => {
      if (!prev || prev.key !== key) return { key, direccion: "asc" }
      if (prev.direccion === "asc") return { key, direccion: "desc" }
      return null
    })
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
        {emptyAction && (
          <button
            type="button"
            onClick={emptyAction.onClick}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) =>
                col.sortable && col.sortValue ? (
                  <TableSort
                    key={col.key}
                    label={col.header}
                    className={col.className}
                    active={orden?.key === col.key}
                    direction={orden?.key === col.key ? orden!.direccion : "asc"}
                    onToggle={() => cambiarOrden(col.key)}
                  />
                ) : (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {datos.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={cn(
                  "transition-colors",
                  hoverable && "hover:bg-muted/50",
                  striped && "even:bg-muted/30"
                )}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {datos.map((item) => (
          <div
            key={keyExtractor(item)}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            {visibleColumns.map((col) => (
              <div
                key={col.key}
                className="flex items-start gap-2 text-sm"
              >
                <span className="font-medium text-muted-foreground w-32 flex-shrink-0">
                  {col.header}
                </span>
                <span className="text-foreground flex-1">
                  {col.render(item)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}