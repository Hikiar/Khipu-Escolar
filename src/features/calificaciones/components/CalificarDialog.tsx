import type { Dispatch, SetStateAction } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Can } from '@/components/guards/Can'
import { AlertTriangle } from 'lucide-react'
import type { AlumnoDeClase } from '@/services/catalogoService'

export function CalificarDialog({
  abierto,
  onCancelar,
  nombre,
  alumnos,
  valores,
  setValores,
  error,
  guardando,
  onGuardar,
}: {
  abierto: boolean
  onCancelar: () => void
  nombre: string | undefined
  alumnos: AlumnoDeClase[]
  valores: Record<string, string>
  setValores: Dispatch<SetStateAction<Record<string, string>>>
  error: string | null
  guardando: boolean
  onGuardar: () => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={(open: boolean) => { if (!open) onCancelar() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Calificar: {nombre}</DialogTitle>
          <DialogDescription>Ingrese las notas de cada alumno (0 a 20)</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 max-h-80 overflow-y-auto">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {alumnos.map(al => (
            <div key={al.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm truncate">{al.apellidos} {al.nombres}</span>
              <Input
                type="number"
                min={0}
                max={20}
                step={0.01}
                className="w-20"
                value={valores[al.id] ?? ''}
                onChange={e => setValores(prev => ({ ...prev, [al.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Can permission="notas.registrar">
            <Button onClick={() => void onGuardar()} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar notas'}
            </Button>
          </Can>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
