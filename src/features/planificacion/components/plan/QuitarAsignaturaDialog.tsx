import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CursoGrado } from '@/services/cursosService'
import type { Grado } from '@/services/gradosService'

export function QuitarAsignaturaDialog({
  dialogoQuitar,
  cerrarDialogoQuitar,
  quitando,
  gradoSeleccionado,
  enviarQuitar,
}: {
  dialogoQuitar: CursoGrado | null
  cerrarDialogoQuitar: () => void
  quitando: boolean
  gradoSeleccionado: Grado | null
  enviarQuitar: () => void
}) {
  return (
    <Dialog open={dialogoQuitar !== null} onOpenChange={(open) => { if (!open) cerrarDialogoQuitar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quitar asignatura del plan</DialogTitle>
          <DialogDescription>
            ¿Quitar <strong>{dialogoQuitar?.cursoNombre}</strong> del plan de <strong>{gradoSeleccionado?.nombre}</strong>?
            Esta acción elimina la relación del plan de estudios.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={cerrarDialogoQuitar} disabled={quitando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={enviarQuitar} disabled={quitando}>
            {quitando ? 'Quitando...' : 'Quitar del plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
