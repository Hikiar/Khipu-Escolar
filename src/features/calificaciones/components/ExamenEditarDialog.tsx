import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { Examen } from '@/services/evaluacionService'

export function ExamenEditarDialog({
  abierto,
  onCancelar,
  examen,
  error,
  formExamenEstado,
  setFormExamenEstado,
  editando,
  onGuardar,
}: {
  abierto: boolean
  onCancelar: () => void
  examen: Examen | null
  error: string | null
  formExamenEstado: 'ACTIVO' | 'INACTIVO'
  setFormExamenEstado: (valor: 'ACTIVO' | 'INACTIVO') => void
  editando: boolean
  onGuardar: () => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={onCancelar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar examen</DialogTitle>
          <DialogDescription>Modifique el estado del examen</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input value={examen?.nombre ?? ''} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select value={formExamenEstado} onValueChange={(v: string) => setFormExamenEstado(v as 'ACTIVO' | 'INACTIVO')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                <SelectItem value="INACTIVO">INACTIVO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} disabled={editando}>Cancelar</Button>
          <Button onClick={() => void onGuardar()} disabled={editando}>
            {editando ? <Loader2 className="size-4 animate-spin" /> : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
