import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import type { Docente } from '@/services/profesoresService'

export function ProfesorReactivarDialog({
  dialogoReactivar,
  setDialogoReactivar,
  reactivando,
  reactivarError,
  ejecutarReactivar,
}: {
  dialogoReactivar: Docente | null
  setDialogoReactivar: (docente: Docente | null) => void
  reactivando: boolean
  reactivarError: string | null
  ejecutarReactivar: () => void
}) {
  return (
    <Dialog
      open={dialogoReactivar !== null}
      onOpenChange={(open) => {
        if (!open) setDialogoReactivar(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Volver a activar profesor</DialogTitle>
          <DialogDescription>
            ¿Está seguro de volver a activar a este profesor? Su estado volverá a ACTIVO.
          </DialogDescription>
        </DialogHeader>

        {dialogoReactivar && (
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">DNI:</span> {dialogoReactivar.dni}
            </p>
            <p>
              <span className="font-medium">Nombre:</span>{' '}
              {dialogoReactivar.nombres} {dialogoReactivar.apellidos}
            </p>
          </div>
        )}

        {reactivarError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{reactivarError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogoReactivar(null)}
            disabled={reactivando}
          >
            Cancelar
          </Button>
          <Button onClick={ejecutarReactivar} disabled={reactivando}>
            {reactivando ? 'Procesando...' : 'Volver a activar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
