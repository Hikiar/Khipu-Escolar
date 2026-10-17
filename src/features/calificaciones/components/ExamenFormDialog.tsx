import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

export function ExamenFormDialog({
  abierto,
  onOpenChange,
  error,
  nuevoExamenNombre,
  setNuevoExamenNombre,
  nuevoExamenFecha,
  setNuevoExamenFecha,
  enviando,
  onGuardar,
}: {
  abierto: boolean
  onOpenChange: (open: boolean) => void
  error: string | null
  nuevoExamenNombre: string
  setNuevoExamenNombre: (valor: string) => void
  nuevoExamenFecha: string
  setNuevoExamenFecha: (valor: string) => void
  enviando: boolean
  onGuardar: () => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo examen</DialogTitle>
          <DialogDescription>Registre un nuevo examen para esta clase y curso</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input value={nuevoExamenNombre} onChange={e => setNuevoExamenNombre(e.target.value)} placeholder="Nombre del examen" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={nuevoExamenFecha} onChange={e => setNuevoExamenFecha(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => void onGuardar()} disabled={enviando || !nuevoExamenNombre.trim()}>
            {enviando ? 'Creando...' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
