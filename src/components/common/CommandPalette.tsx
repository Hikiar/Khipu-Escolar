import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useFilteredNav } from '@/hooks/useFilteredNav'
import type { NavItem } from '@/types/navigation'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function flattenNav(
  grupos: { label: string; items: NavItem[] }[],
  termino: string,
): { item: NavItem; group: string }[] {
  const normalizado = termino.trim().toLowerCase()
  const resultados: { item: NavItem; group: string }[] = []
  for (const grupo of grupos) {
    for (const item of grupo.items) {
      const coincide =
        !normalizado ||
        item.title.toLowerCase().includes(normalizado) ||
        (item.description ?? '').toLowerCase().includes(normalizado)
      if (coincide) {
        resultados.push({ item, group: grupo.label })
      }
    }
  }
  return resultados
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const navigationGroups = useFilteredNav()
  const [busqueda, setBusqueda] = useState('')
  const [indiceActivo, setIndiceActivo] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items = useMemo(
    () => flattenNav(navigationGroups, busqueda),
    [navigationGroups, busqueda],
  )

  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(() => inputRef.current?.focus())
      return () => window.cancelAnimationFrame(id)
    }
  }, [open])

  function manejarCambioApertura(abierta: boolean) {
    if (!abierta) {
      setBusqueda('')
      setIndiceActivo(0)
    }
    onOpenChange(abierta)
  }

  function elegir(indice: number) {
    const entrada = items[indice]
    if (!entrada) return
    navigate(entrada.item.href)
    onOpenChange(false)
  }

  function manejarTeclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setIndiceActivo((i) => (i + 1) % Math.max(items.length, 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setIndiceActivo((i) =>
        (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1),
      )
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      elegir(indiceActivo)
    }
  }

  return (
    <Dialog open={open} onOpenChange={manejarCambioApertura}>
      <DialogContent
        className="top-20 translate-y-0 p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Navegación rápida</DialogTitle>
        <div className="relative border-b px-4">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setIndiceActivo(0)
            }}
            onKeyDown={manejarTeclado}
            placeholder="Buscar en la aplicación…"
            aria-label="Buscar en la aplicación"
            aria-expanded="true"
            aria-controls="paleta-resultados"
            aria-activedescendant={
              items[indiceActivo] ? `paleta-item-${indiceActivo}` : undefined
            }
            className="h-12 border-0 bg-transparent pl-9 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <ul
          id="paleta-resultados"
          role="listbox"
          aria-label="Páginas disponibles"
          className="max-h-72 overflow-y-auto p-2"
        >
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para &quot;{busqueda}&quot;.
            </li>
          )}
          {items.map(({ item, group }, i) => (
            <li
              key={item.href}
              id={`paleta-item-${i}`}
              role="option"
              aria-selected={i === indiceActivo}
              onMouseEnter={() => setIndiceActivo(i)}
              onClick={() => elegir(i)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                i === indiceActivo && 'bg-accent text-accent-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate">
                <span className="block">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{group}</span>
              </span>
              {i === indiceActivo && (
                <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}