import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Grado } from '@/services/gradosService'

export function EliminarGradoDialog({
  gradoPorEliminar,
  setGradoPorEliminar,
  eliminandoGrado,
  manejarEliminarGrado,
}: {
  gradoPorEliminar: Grado | null
  setGradoPorEliminar: (grado: Grado | null) => void
  eliminandoGrado: boolean
  manejarEliminarGrado: () => void
}) {
  return (
    <Dialog
      open={gradoPorEliminar !== null}
      onOpenChange={(open) => { if (!open) setGradoPorEliminar(null) }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar grado</DialogTitle>
          <DialogDescription>
            ¿Eliminar el grado <strong>{gradoPorEliminar?.nombre}</strong>? Solo es posible si no tiene clases asociadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setGradoPorEliminar(null)} disabled={eliminandoGrado}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void manejarEliminarGrado()} disabled={eliminandoGrado}>
            {eliminandoGrado ? 'Eliminando...' : 'Eliminar grado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
