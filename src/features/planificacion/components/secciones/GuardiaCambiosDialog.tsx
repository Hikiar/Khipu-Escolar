import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function GuardiaCambiosDialog({
  abierto,
  guardando,
  onDescartar,
  onGuardar,
  onSeguirEditando,
}: {
  abierto: boolean
  guardando: boolean
  onDescartar: () => void
  onGuardar: () => void
  onSeguirEditando: () => void
}) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) onSeguirEditando()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambios sin guardar</DialogTitle>
          <DialogDescription>
            Tienes cambios en el borrador de esta sección. ¿Qué deseas hacer antes de salir?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onSeguirEditando} disabled={guardando}>
            Seguir editando
          </Button>
          <Button variant="destructive" onClick={onDescartar} disabled={guardando}>
            Descartar cambios
          </Button>
          <Button onClick={onGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar y continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
