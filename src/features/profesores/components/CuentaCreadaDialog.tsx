import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Check, Copy, KeyRound } from 'lucide-react'
import type { CrearCuentaDocenteResultado } from '@/services/profesoresService'

export function CuentaCreadaDialog({
  cuentaCreada,
  setCuentaCreada,
  copiadoCuenta,
  copiarCuenta,
}: {
  cuentaCreada: CrearCuentaDocenteResultado | null
  setCuentaCreada: (cuenta: CrearCuentaDocenteResultado | null) => void
  copiadoCuenta: 'codigo' | 'password' | null
  copiarCuenta: (texto: string, tipo: 'codigo' | 'password') => Promise<void>
}) {
  return (
    <Dialog
      open={cuentaCreada !== null}
      onOpenChange={(open) => {
        if (!open) setCuentaCreada(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="size-5 text-emerald-600" aria-hidden />
            Cuenta creada
          </DialogTitle>
          <DialogDescription>
            Comparta estos datos con el profesor. La contraseña solo se muestra
            esta vez; también podrá recuperarla desde Usuarios mientras siga
            pendiente de cambio.
          </DialogDescription>
        </DialogHeader>

        {cuentaCreada && (
          <div className="grid gap-3">
            <div className="grid gap-2 rounded-lg border p-3">
              <Label className="text-xs">Usuario (código institucional)</Label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {cuentaCreada.username}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => void copiarCuenta(cuentaCreada.username, 'codigo')}
                >
                  {copiadoCuenta === 'codigo' ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <Copy className="size-3" aria-hidden />
                  )}
                  {copiadoCuenta === 'codigo' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>

            {cuentaCreada.passwordGenerada && (
              <div className="grid gap-2 rounded-lg border p-3">
                <Label className="flex items-center gap-1.5 text-xs">
                  <KeyRound className="size-3.5" aria-hidden />
                  Contraseña provisional
                </Label>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-semibold">
                    {cuentaCreada.passwordGenerada}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => void copiarCuenta(cuentaCreada.passwordGenerada ?? '', 'password')}
                  >
                    {copiadoCuenta === 'password' ? (
                      <Check className="size-3" aria-hidden />
                    ) : (
                      <Copy className="size-3" aria-hidden />
                    )}
                    {copiadoCuenta === 'password' ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setCuentaCreada(null)}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
