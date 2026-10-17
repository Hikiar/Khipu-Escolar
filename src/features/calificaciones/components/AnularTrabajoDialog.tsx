import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { Trabajo } from '@/services/evaluacionService'

export function AnularTrabajoDialog({
  objetivo,
  onCancelar,
  onConfirmar,
}: {
  objetivo: Trabajo | null
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return (
    <Dialog open={objetivo !== null} onOpenChange={(open: boolean) => { if (!open) onCancelar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar anulación</DialogTitle>
          <DialogDescription>
            Se anulará el trabajo "{objetivo?.nombre}". Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Button variant="destructive" onClick={() => void onConfirmar()}>Anular</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
