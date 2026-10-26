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
import { Check, UserRound } from 'lucide-react'
import { cn } from 'cn'
import type { Docente } from '@/services/catalogoService'

export function nombreDocente(docente: Docente): string {
  return `${docente.nombres} ${docente.apellidos}`
}

/**
 * Diálogo dedicado para nombrar o cambiar el tutor de una sección.
 * Sustituye al `Select` inline del resumen.
 */
export function AsignarTutorDialog({
  abierto,
  tutorActualId,
  docentes,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean
  tutorActualId: string | null
  docentes: Docente[]
  onCerrar: () => void
  onConfirmar: (docenteId: string | null) => void
}) {
  const [seleccion, setSeleccion] = useState<string | null>(tutorActualId)

  useEffect(() => {
    if (abierto) setSeleccion(tutorActualId)
  }, [abierto, tutorActualId])

  const opciones: { id: string | null; etiqueta: string; detalle?: string }[] = [
    { id: null, etiqueta: 'Sin tutor', detalle: 'Dejar la sección sin tutor asignado' },
    ...docentes.map((docente) => ({
      id: docente.id,
      etiqueta: nombreDocente(docente),
      detalle: docente.especialidad || docente.codigoInstitucional,
    })),
  ]

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) onCerrar() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar tutor de aula</DialogTitle>
          <DialogDescription>
            Elige al docente responsable del aula. Solo se muestran docentes activos habilitados para el nivel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 px-4 pb-2 max-h-80 overflow-y-auto">
          {opciones.map((opcion) => {
            const activo = opcion.id === seleccion
            return (
              <button
                key={opcion.id ?? 'sin-tutor'}
                type="button"
                onClick={() => setSeleccion(opcion.id)}
                aria-pressed={activo}
                className={cn(
                  'flex items-start gap-3 rounded-lg border border-border p-3 text-left outline-none transition-colors',
                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  activo && 'border-primary bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-input',
                    activo && 'border-primary bg-primary text-primary-foreground',
                  )}
                  aria-hidden
                >
                  {opcion.id === null ? (
                    <UserRound className="size-3" />
                  ) : activo ? (
                    <Check className="size-3.5" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{opcion.etiqueta}</span>
                  {opcion.detalle && (
                    <span className="block text-xs text-muted-foreground">{opcion.detalle}</span>
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
          <Button onClick={() => onConfirmar(seleccion)}>Aplicar tutor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
