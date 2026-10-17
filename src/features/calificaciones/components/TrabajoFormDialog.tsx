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
import { AlertTriangle } from 'lucide-react'
import type { CompetenciaCurso } from '@/services/catalogoService'

export function TrabajoFormDialog({
  abierto,
  onOpenChange,
  error,
  competencias,
  nuevoTrabajoCompetencia,
  setNuevoTrabajoCompetencia,
  nuevoTrabajoNombre,
  setNuevoTrabajoNombre,
  nuevoTrabajoFecha,
  setNuevoTrabajoFecha,
  nuevoTrabajoDesc,
  setNuevoTrabajoDesc,
  enviando,
  onGuardar,
}: {
  abierto: boolean
  onOpenChange: (open: boolean) => void
  error: string | null
  competencias: CompetenciaCurso[]
  nuevoTrabajoCompetencia: string
  setNuevoTrabajoCompetencia: (valor: string) => void
  nuevoTrabajoNombre: string
  setNuevoTrabajoNombre: (valor: string) => void
  nuevoTrabajoFecha: string
  setNuevoTrabajoFecha: (valor: string) => void
  nuevoTrabajoDesc: string
  setNuevoTrabajoDesc: (valor: string) => void
  enviando: boolean
  onGuardar: () => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo trabajo</DialogTitle>
          <DialogDescription>Registre un nuevo trabajo de evaluación</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Competencia</Label>
            <Select value={nuevoTrabajoCompetencia} onValueChange={(v: string) => setNuevoTrabajoCompetencia(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar competencia" />
              </SelectTrigger>
              <SelectContent>
                {competencias.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input value={nuevoTrabajoNombre} onChange={e => setNuevoTrabajoNombre(e.target.value)} placeholder="Nombre del trabajo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={nuevoTrabajoFecha} onChange={e => setNuevoTrabajoFecha(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Descripción (opcional)</Label>
            <Input value={nuevoTrabajoDesc} onChange={e => setNuevoTrabajoDesc(e.target.value)} placeholder="Descripción" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => void onGuardar()} disabled={enviando || !nuevoTrabajoNombre.trim() || !nuevoTrabajoCompetencia}>
            {enviando ? 'Creando...' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
