import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import type { CrearSeccionInput, Seccion } from '@/services/gradosService'

export function SeccionFormDialog({
  dialogoSeccion,
  cerrarDialogoSeccion,
  formSeccion,
  setFormSeccion,
  formSeccionErrores,
  formSeccionEnviando,
  enviarSeccion,
}: {
  dialogoSeccion: { abierto: boolean; modo: 'crear' | 'editar'; gradoId: string; seccion?: Seccion }
  cerrarDialogoSeccion: () => void
  formSeccion: CrearSeccionInput
  setFormSeccion: (form: CrearSeccionInput) => void
  formSeccionErrores: Partial<CrearSeccionInput>
  formSeccionEnviando: boolean
  enviarSeccion: () => void
}) {
  return (
    <Dialog open={dialogoSeccion.abierto} onOpenChange={(open) => { if (!open) cerrarDialogoSeccion() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogoSeccion.modo === 'crear' ? 'Crear sección' : 'Editar sección'}</DialogTitle>
          <DialogDescription>
            {dialogoSeccion.modo === 'crear'
              ? 'Añade una división al grado seleccionado'
              : `Modifica los datos de ${dialogoSeccion.seccion?.nombre}`}
          </DialogDescription>
        </DialogHeader>

        {formSeccionErrores.nombre && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertDescription>{formSeccionErrores.nombre}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="seccion-nombre">Nombre</Label>
            <Input
              id="seccion-nombre"
              value={formSeccion.nombre}
              onChange={(e) => setFormSeccion({ ...formSeccion, nombre: e.target.value })}
              placeholder="Ej: A, B, Única"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seccion-turno">Turno</Label>
            <Select value={formSeccion.turno} onValueChange={(v) => setFormSeccion({ ...formSeccion, turno: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar turno (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAÑANA">Mañana</SelectItem>
                <SelectItem value="TARDE">Tarde</SelectItem>
                <SelectItem value="NOCHE">Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cerrarDialogoSeccion} disabled={formSeccionEnviando}>
            Cancelar
          </Button>
          <Button onClick={enviarSeccion} disabled={formSeccionEnviando}>
            {formSeccionEnviando ? 'Guardando...' : dialogoSeccion.modo === 'crear' ? 'Crear' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
