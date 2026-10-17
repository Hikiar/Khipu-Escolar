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
import { NIVELES, etiquetaNiveles } from '@/lib/nivelesCurso'
import { gradosCneBDeNivel } from '@/lib/gradosCneb'
import type { CrearGradoInput } from '@/services/gradosService'

export function GradoFormDialog({
  dialogoGrado,
  cerrarDialogoGrado,
  formGrado,
  setFormGrado,
  formGradoErrores,
  formGradoEnviando,
  gradoSugeridoId,
  setGradoSugeridoId,
  aplicarGradoSugerido,
  enviarGrado,
}: {
  dialogoGrado: { abierto: boolean; modo: 'crear' | 'editar'; grado?: { nombre?: string } }
  cerrarDialogoGrado: () => void
  formGrado: CrearGradoInput
  setFormGrado: (form: CrearGradoInput) => void
  formGradoErrores: Partial<CrearGradoInput>
  formGradoEnviando: boolean
  gradoSugeridoId: string
  setGradoSugeridoId: (id: string) => void
  aplicarGradoSugerido: (codigo: string) => void
  enviarGrado: () => void
}) {
  return (
    <Dialog open={dialogoGrado.abierto} onOpenChange={(open) => { if (!open) cerrarDialogoGrado() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogoGrado.modo === 'crear' ? 'Crear grado' : 'Editar grado'}</DialogTitle>
          <DialogDescription>
            {dialogoGrado.modo === 'crear'
              ? 'Registra un nuevo grado'
              : `Modifica los datos de ${dialogoGrado.grado?.nombre}`}
          </DialogDescription>
        </DialogHeader>

        {formGradoErrores.codigo && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertDescription>{formGradoErrores.codigo}</AlertDescription>
          </Alert>
        )}
        {formGradoErrores.nombre && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertDescription>{formGradoErrores.nombre}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 px-4 pb-4">
          {dialogoGrado.modo === 'crear' && (
            <div className="grid gap-2">
              <Label htmlFor="grado-sugerido">Grado del catálogo (CNEB)</Label>
              <Select
                value={gradoSugeridoId}
                onValueChange={aplicarGradoSugerido}
                disabled={!formGrado.nivel}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      formGrado.nivel
                        ? 'Elige un grado oficial del nivel'
                        : 'Primero selecciona el nivel'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {gradosCneBDeNivel(formGrado.nivel).map((g) => (
                    <SelectItem key={g.codigo} value={g.codigo}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="grado-codigo">Código</Label>
            <Input
              id="grado-codigo"
              value={formGrado.codigo}
              onChange={(e) => setFormGrado({ ...formGrado, codigo: e.target.value })}
              placeholder="Ej: 1PRI"
              disabled={dialogoGrado.modo === 'editar'}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="grado-nombre">Nombre</Label>
            <Input
              id="grado-nombre"
              value={formGrado.nombre}
              onChange={(e) => setFormGrado({ ...formGrado, nombre: e.target.value })}
              placeholder="Ej: Primero de Primaria"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="grado-nivel">Nivel</Label>
            <Select value={formGrado.nivel} onValueChange={(v) => { setFormGrado({ ...formGrado, nivel: v }); setGradoSugeridoId('') }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                {NIVELES.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>
                    {etiquetaNiveles([nivel])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="grado-orden">Orden</Label>
            <Input
              id="grado-orden"
              type="number"
              min="0"
              value={formGrado.orden}
              onChange={(e) => setFormGrado({ ...formGrado, orden: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cerrarDialogoGrado} disabled={formGradoEnviando}>
            Cancelar
          </Button>
          <Button onClick={enviarGrado} disabled={formGradoEnviando}>
            {formGradoEnviando ? 'Guardando...' : dialogoGrado.modo === 'crear' ? 'Crear' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
