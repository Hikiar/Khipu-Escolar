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
import { AlertTriangle, KeyRound } from 'lucide-react'
import type { Docente } from '@/services/profesoresService'

export function CuentaDocenteDialog({
  dialogoCuenta,
  setDialogoCuenta,
  creandoCuenta,
  cuentaError,
  ejecutarCrearCuenta,
}: {
  dialogoCuenta: Docente | null
  setDialogoCuenta: (docente: Docente | null) => void
  creandoCuenta: boolean
  cuentaError: string | null
  ejecutarCrearCuenta: () => void
}) {
  return (
    <Dialog
      open={dialogoCuenta !== null}
      onOpenChange={(open) => {
        if (!open) setDialogoCuenta(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-violet-600" aria-hidden />
            Crear cuenta de acceso
          </DialogTitle>
          <DialogDescription>
            Se creará la cuenta de acceso de{' '}
            <strong>{dialogoCuenta?.nombres} {dialogoCuenta?.apellidos}</strong>{' '}
            ({dialogoCuenta?.codigoInstitucional}) con el rol Profesor. Se
            generará una contraseña temporal que deberá cambiarse en el primer
            ingreso.
          </DialogDescription>
        </DialogHeader>

        {cuentaError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{cuentaError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogoCuenta(null)}
            disabled={creandoCuenta}
          >
            Cancelar
          </Button>
          <Button onClick={ejecutarCrearCuenta} disabled={creandoCuenta}>
            {creandoCuenta ? 'Creando...' : 'Crear cuenta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
