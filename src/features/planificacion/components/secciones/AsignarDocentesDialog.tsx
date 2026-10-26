import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import type { Docente } from '@/services/catalogoService'
import { nombreDocente } from './AsignarTutorDialog'

/**
 * Diálogo dedicado para asignar uno o varios docentes a una asignatura de la
 * sección. Sustituye al `Select` inline de la tabla de asignaturas.
 */
export function AsignarDocentesDialog({
  abierto,
  cursoNombre,
  seleccionados,
  docentes,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean
  cursoNombre: string
  seleccionados: string[]
  docentes: Docente[]
  onCerrar: () => void
  onConfirmar: (docenteIds: string[]) => void
}) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(seleccionados))

  useEffect(() => {
    if (abierto) setSeleccion(new Set(seleccionados))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, cursoNombre])

  const alternar = (docenteId: string, marcado: boolean) => {
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      if (marcado) siguiente.add(docenteId)
      else siguiente.delete(docenteId)
      return siguiente
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) onCerrar() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Docentes de la asignatura</DialogTitle>
          <DialogDescription>
            Marca los docentes que dictarán <strong>{cursoNombre}</strong> en esta sección. Puedes asignar más de uno.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1 px-4 pb-2 max-h-80 overflow-y-auto">
          {docentes.map((docente) => {
            const id = `docente-${docente.id}`
            const marcado = seleccion.has(docente.id)
            return (
              <label
                key={docente.id}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2.5 hover:bg-muted"
              >
                <Checkbox
                  id={id}
                  checked={marcado}
                  onCheckedChange={(valor) => alternar(docente.id, valor === true)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{nombreDocente(docente)}</span>
                  {(docente.especialidad || docente.codigoInstitucional) && (
                    <span className="block text-xs text-muted-foreground">
                      {docente.especialidad || docente.codigoInstitucional}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
          {docentes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay docentes activos habilitados para este nivel.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirmar([...seleccion])}>
            Aplicar {seleccion.size > 0 ? `(${seleccion.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
