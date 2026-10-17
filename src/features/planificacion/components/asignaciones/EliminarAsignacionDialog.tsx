import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { AsignacionCurso } from '@/services/asignacionService'

export function EliminarAsignacionDialog({
  objetivo,
  eliminando,
  onCancelar,
  onConfirmar,
}: {
  objetivo: AsignacionCurso | null
  eliminando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return (
    <Dialog open={objetivo !== null} onOpenChange={(open) => { if (!open) onCancelar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogDescription>
            {objetivo
              ? `Se eliminará la asignación de ${objetivo.docente.nombres} ${objetivo.docente.apellidos} a la asignatura ${objetivo.curso.codigo} en ${objetivo.clase.gradoNombre} ${objetivo.clase.seccionNombre}.`
              : 'Se eliminará la asignación seleccionada.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} disabled={eliminando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmar} disabled={eliminando}>
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
