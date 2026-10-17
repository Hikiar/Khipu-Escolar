import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Clase } from '@/services/gradosService'

export function EliminarClaseDialog({
  clasePorEliminar,
  setClasePorEliminar,
  eliminandoClase,
  manejarEliminarClase,
}: {
  clasePorEliminar: Clase | null
  setClasePorEliminar: (clase: Clase | null) => void
  eliminandoClase: boolean
  manejarEliminarClase: () => void
}) {
  return (
    <Dialog
      open={clasePorEliminar !== null}
      onOpenChange={(open) => { if (!open) setClasePorEliminar(null) }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar clase</DialogTitle>
          <DialogDescription>
            ¿Eliminar la clase <strong>{clasePorEliminar?.gradoNombre}</strong> — {clasePorEliminar?.seccionNombre} ({clasePorEliminar?.periodoCodigo})?
            Esta acción la borra definitivamente y no es posible si tiene matrículas, asistencias, asignaciones o calificaciones asociadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setClasePorEliminar(null)} disabled={eliminandoClase}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={manejarEliminarClase} disabled={eliminandoClase}>
            {eliminandoClase ? 'Eliminando...' : 'Eliminar clase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
