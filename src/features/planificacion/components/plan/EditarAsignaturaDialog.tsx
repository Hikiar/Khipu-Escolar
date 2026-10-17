import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CursoGrado } from '@/services/cursosService'
import type { Grado } from '@/services/gradosService'

export function EditarAsignaturaDialog({
  dialogoEditar,
  cerrarDialogoEditar,
  editHorasSemana,
  setEditHorasSemana,
  editOrden,
  setEditOrden,
  editEnviando,
  gradoSeleccionado,
  enviarEditar,
}: {
  dialogoEditar: CursoGrado | null
  cerrarDialogoEditar: () => void
  editHorasSemana: string
  setEditHorasSemana: (valor: string) => void
  editOrden: string
  setEditOrden: (valor: string) => void
  editEnviando: boolean
  gradoSeleccionado: Grado | null
  enviarEditar: () => void
}) {
  return (
    <Dialog open={dialogoEditar !== null} onOpenChange={(open) => { if (!open) cerrarDialogoEditar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar asignatura en el plan</DialogTitle>
          <DialogDescription>
            Modifica las horas semanales y el orden para <strong>{dialogoEditar?.cursoNombre}</strong> en <strong>{gradoSeleccionado?.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-horasSemana">Horas semanales</Label>
            <Input
              id="edit-horasSemana"
              type="number"
              min="1"
              max="20"
              value={editHorasSemana}
              onChange={(e) => setEditHorasSemana(e.target.value)}
              placeholder="Ej: 4"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-orden">Orden</Label>
            <Input
              id="edit-orden"
              type="number"
              min="0"
              value={editOrden}
              onChange={(e) => setEditOrden(e.target.value)}
              placeholder="Ej: 1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cerrarDialogoEditar} disabled={editEnviando}>
            Cancelar
          </Button>
          <Button onClick={enviarEditar} disabled={editEnviando}>
            {editEnviando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
