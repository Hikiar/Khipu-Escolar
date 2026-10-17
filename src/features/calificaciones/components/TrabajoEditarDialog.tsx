import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import type { Trabajo } from '@/services/evaluacionService'

export function TrabajoEditarDialog({
  trabajo,
  onCancelar,
  error,
  editTrabajoNombre,
  setEditTrabajoNombre,
  editTrabajoFecha,
  setEditTrabajoFecha,
  editTrabajoDesc,
  setEditTrabajoDesc,
  editando,
  traducirCompetencia,
  onGuardar,
}: {
  trabajo: Trabajo | null
  onCancelar: () => void
  error: string | null
  editTrabajoNombre: string
  setEditTrabajoNombre: (valor: string) => void
  editTrabajoFecha: string
  setEditTrabajoFecha: (valor: string) => void
  editTrabajoDesc: string
  setEditTrabajoDesc: (valor: string) => void
  editando: boolean
  traducirCompetencia: (compId: string) => string
  onGuardar: () => void
}) {
  return (
    <Dialog open={trabajo !== null} onOpenChange={(open: boolean) => { if (!open) onCancelar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar trabajo</DialogTitle>
          <DialogDescription>Modifique los datos del trabajo de evaluación</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-trabajo-competencia">Competencia (solo lectura)</Label>
            <Input
              id="edit-trabajo-competencia"
              value={trabajo ? traducirCompetencia(trabajo.competenciaCursoId) : ''}
              disabled
              readOnly
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-trabajo-nombre">Nombre</Label>
            <Input id="edit-trabajo-nombre" value={editTrabajoNombre} onChange={e => setEditTrabajoNombre(e.target.value)} placeholder="Nombre del trabajo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-trabajo-fecha">Fecha</Label>
            <Input id="edit-trabajo-fecha" type="date" value={editTrabajoFecha} onChange={e => setEditTrabajoFecha(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-trabajo-desc">Descripción (opcional)</Label>
            <Input id="edit-trabajo-desc" value={editTrabajoDesc} onChange={e => setEditTrabajoDesc(e.target.value)} placeholder="Descripción" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} disabled={editando}>Cancelar</Button>
          <Button onClick={() => void onGuardar()} disabled={editando || !editTrabajoNombre.trim()}>
            {editando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
