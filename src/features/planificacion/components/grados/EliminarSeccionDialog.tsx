import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Seccion } from '@/services/gradosService'

export function EliminarSeccionDialog({
  seccionPorEliminar,
  setSeccionPorEliminar,
  eliminandoSeccion,
  manejarEliminarSeccion,
}: {
  seccionPorEliminar: { seccion: Seccion; gradoId: string } | null
  setSeccionPorEliminar: (valor: { seccion: Seccion; gradoId: string } | null) => void
  eliminandoSeccion: boolean
  manejarEliminarSeccion: () => void
}) {
  return (
    <Dialog
      open={seccionPorEliminar !== null}
      onOpenChange={(open) => { if (!open) setSeccionPorEliminar(null) }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar sección</DialogTitle>
          <DialogDescription>
            ¿Eliminar la sección <strong>{seccionPorEliminar?.seccion.nombre}</strong> del grado?
            Esta acción la borra definitivamente y solo es posible si no tiene clases asociadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSeccionPorEliminar(null)} disabled={eliminandoSeccion}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={manejarEliminarSeccion} disabled={eliminandoSeccion}>
            {eliminandoSeccion ? 'Eliminando...' : 'Eliminar sección'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
