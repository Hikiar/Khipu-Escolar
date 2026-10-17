import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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

export function ProfesorDesactivarDialog({
  dialogoDesactivar,
  setDialogoDesactivar,
  desactivando,
  desactivarError,
  ejecutarDesactivar,
}: {
  dialogoDesactivar: Docente | null
  setDialogoDesactivar: (docente: Docente | null) => void
  desactivando: boolean
  desactivarError: string | null
  ejecutarDesactivar: () => void
}) {
  return (
    <Dialog
      open={dialogoDesactivar !== null}
      onOpenChange={(open) => {
        if (!open) setDialogoDesactivar(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de baja profesor</DialogTitle>
          <DialogDescription>
            ¿Está seguro de dar de baja a este profesor? Esta acción cambiará su estado a INACTIVO.
            No se puede dar de baja si tiene asignaciones de curso activas.
          </DialogDescription>
        </DialogHeader>

        {dialogoDesactivar && (
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">DNI:</span> {dialogoDesactivar.dni}
            </p>
            <p>
              <span className="font-medium">Nombre:</span>{' '}
              {dialogoDesactivar.nombres} {dialogoDesactivar.apellidos}
            </p>
            <p>
              <span className="font-medium">Estado actual:</span>{' '}
              <Badge variant={dialogoDesactivar.estado === 'ACTIVO' ? 'success' : 'outline'}>
                {dialogoDesactivar.estado}
              </Badge>
            </p>
          </div>
        )}

        {desactivarError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{desactivarError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogoDesactivar(null)}
            disabled={desactivando}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={ejecutarDesactivar}
            disabled={desactivando}
          >
            {desactivando ? 'Procesando...' : 'Dar de baja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
