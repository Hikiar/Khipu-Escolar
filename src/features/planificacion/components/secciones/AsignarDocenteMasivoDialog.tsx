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
import { Check } from 'lucide-react'
import { cn } from 'cn'
import type { Docente } from '@/services/catalogoService'
import { nombreDocente } from './AsignarTutorDialog'

/**
 * Diálogo para asignar un docente a todas las asignaturas que aún no tienen
 * ninguno. Sustituye al `Select` "Asignar a las pendientes".
 */
export function AsignarDocenteMasivoDialog({
  abierto,
  pendientes,
  docentes,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean
  pendientes: number
  docentes: Docente[]
  onCerrar: () => void
  onConfirmar: (docenteId: string) => void
}) {
  const [seleccion, setSeleccion] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) setSeleccion(null)
  }, [abierto])

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) onCerrar() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar docente a asignaturas pendientes</DialogTitle>
          <DialogDescription>
            Se asignará el docente elegido a las <strong>{pendientes}</strong> asignaturas sin docente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 px-4 pb-2 max-h-80 overflow-y-auto">
          {docentes.map((docente) => {
            const activo = docente.id === seleccion
            return (
              <button
                key={docente.id}
                type="button"
                onClick={() => setSeleccion(docente.id)}
                aria-pressed={activo}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border p-3 text-left outline-none transition-colors',
                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  activo && 'border-primary bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border border-input',
                    activo && 'border-primary bg-primary text-primary-foreground',
                  )}
                  aria-hidden
                >
                  {activo && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{nombreDocente(docente)}</span>
                  {(docente.especialidad || docente.codigoInstitucional) && (
                    <span className="block text-xs text-muted-foreground">
                      {docente.especialidad || docente.codigoInstitucional}
                    </span>
                  )}
                </span>
              </button>
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
          <Button
            disabled={!seleccion}
            onClick={() => { if (seleccion) onConfirmar(seleccion) }}
          >
            Asignar a pendientes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
