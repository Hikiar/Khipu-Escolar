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
import type { Curso } from '@/services/cursosService'
import type { Grado } from '@/services/gradosService'

export function AgregarAsignaturaDialog({
  dialogoAgregar,
  setDialogoAgregar,
  cerrarDialogoAgregar,
  formCursoId,
  setFormCursoId,
  formHorasSemana,
  setFormHorasSemana,
  formOrden,
  setFormOrden,
  formAgregarError,
  formAgregarEnviando,
  catalogoCursos,
  catalogoCursosCargando,
  gradoSeleccionado,
  enviarAgregar,
}: {
  dialogoAgregar: boolean
  setDialogoAgregar: (abierto: boolean) => void
  cerrarDialogoAgregar: () => void
  formCursoId: string
  setFormCursoId: (valor: string) => void
  formHorasSemana: string
  setFormHorasSemana: (valor: string) => void
  formOrden: string
  setFormOrden: (valor: string) => void
  formAgregarError: string | null
  formAgregarEnviando: boolean
  catalogoCursos: Curso[]
  catalogoCursosCargando: boolean
  gradoSeleccionado: Grado | null
  enviarAgregar: () => void
}) {
  return (
    <Dialog open={dialogoAgregar} onOpenChange={setDialogoAgregar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir asignatura al plan de estudios</DialogTitle>
          <DialogDescription>
            Selecciona una asignatura y configura las horas semanales y el orden para el grado <strong>{gradoSeleccionado?.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>

        {formAgregarError && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formAgregarError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="cursoId">Asignatura</Label>
            <Select value={formCursoId} onValueChange={setFormCursoId}>
              <SelectTrigger className="w-full">
                <SelectValue                   placeholder="Seleccionar asignatura" />
              </SelectTrigger>
              <SelectContent>
                {catalogoCursosCargando && (
                  <SelectItem value="" disabled>Cargando asignaturas…</SelectItem>
                )}
                {!catalogoCursosCargando && catalogoCursos.length === 0 && (
                  <SelectItem value="" disabled>No hay asignaturas disponibles para añadir</SelectItem>
                )}
                {catalogoCursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="horasSemana">Horas semanales</Label>
            <Input
              id="horasSemana"
              type="number"
              min="1"
              max="20"
              value={formHorasSemana}
              onChange={(e) => setFormHorasSemana(e.target.value)}
              placeholder="Ej: 4"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              type="number"
              min="0"
              value={formOrden}
              onChange={(e) => setFormOrden(e.target.value)}
              placeholder="Ej: 1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cerrarDialogoAgregar} disabled={formAgregarEnviando}>
            Cancelar
          </Button>
          <Button onClick={enviarAgregar} disabled={formAgregarEnviando || !gradoSeleccionado}>
            {formAgregarEnviando ? 'Guardando...' : 'Añadir al plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
