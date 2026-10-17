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
import type { CrearClaseInput, Grado } from '@/services/gradosService'
import type { PeriodoAcademico, Docente } from '@/services/catalogoService'

export function ClaseFormDialog({
  dialogoClase,
  cerrarDialogoClase,
  formClase,
  setFormClase,
  formClaseErrores,
  formClaseEnviando,
  enviarClase,
  periodo,
  docentes,
  grados,
  seccionesParaSelect,
  cargarSeccionesParaGrado,
}: {
  dialogoClase: { abierto: boolean; modo: 'crear' | 'editar'; clase?: unknown }
  cerrarDialogoClase: () => void
  formClase: CrearClaseInput & { estado?: string }
  setFormClase: (form: CrearClaseInput & { estado?: string }) => void
  formClaseErrores: Partial<CrearClaseInput>
  formClaseEnviando: boolean
  enviarClase: () => void
  periodo: PeriodoAcademico | null
  docentes: Docente[]
  grados: Grado[]
  seccionesParaSelect: { id: string; gradoId: string; nombre: string; turno: string }[]
  cargarSeccionesParaGrado: (gradoId: string) => void | Promise<void>
}) {
  return (
    <Dialog open={dialogoClase.abierto} onOpenChange={(open) => { if (!open) cerrarDialogoClase() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogoClase.modo === 'crear' ? 'Crear clase' : 'Editar clase'}</DialogTitle>
          <DialogDescription>
            {dialogoClase.modo === 'crear'
              ? 'Configura un nuevo grupo de estudiantes'
              : `Modifica los datos de la clase`}
          </DialogDescription>
        </DialogHeader>

        {formClaseErrores.periodoId && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertDescription>{formClaseErrores.periodoId}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="clase-periodo">Año lectivo</Label>
            <Select value={formClase.periodoId} onValueChange={(v) => setFormClase({ ...formClase, periodoId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodo && <SelectItem key={periodo.id} value={periodo.id}>{periodo.nombre}</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clase-grado">Grado</Label>
            <Select value={formClase.gradoId} onValueChange={(v) => { setFormClase({ ...formClase, gradoId: v, seccionId: '' }); if (v) { void cargarSeccionesParaGrado(v); } }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar grado" />
              </SelectTrigger>
              <SelectContent>
                {grados.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.codigo} — {g.nombre} <span className="text-muted-foreground">({g.nivel})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clase-seccion">Sección</Label>
            <Select value={formClase.seccionId} onValueChange={(v) => setFormClase({ ...formClase, seccionId: v })} disabled={!formClase.gradoId || seccionesParaSelect.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!formClase.gradoId ? 'Primero selecciona un grado' : seccionesParaSelect.length === 0 ? 'Sin secciones' : 'Seleccionar sección'} />
              </SelectTrigger>
              <SelectContent>
                {seccionesParaSelect
                  .filter((s) => s.gradoId === formClase.gradoId)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} {s.turno ? `(${s.turno})` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clase-tutor">Tutor de aula</Label>
            <Select value={formClase.tutorDocenteId ?? ''} onValueChange={(v) => setFormClase({ ...formClase, tutorDocenteId: v || undefined })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin tutor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Sin tutor —</SelectItem>
                {docentes.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombres} {d.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clase-vacantes">Cupos disponibles</Label>
            <Input
              id="clase-vacantes"
              type="number"
              min="1"
              max="50"
              value={formClase.vacantes}
              onChange={(e) => setFormClase({ ...formClase, vacantes: Number(e.target.value) || 30 })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clase-estado">Estado</Label>
            <Select value={formClase.estado ?? 'ACTIVO'} onValueChange={(v) => setFormClase({ ...formClase, estado: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">Activa</SelectItem>
                <SelectItem value="CERRADA">Cerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cerrarDialogoClase} disabled={formClaseEnviando}>
            Cancelar
          </Button>
          <Button onClick={enviarClase} disabled={formClaseEnviando}>
            {formClaseEnviando ? 'Guardando...' : dialogoClase.modo === 'crear' ? 'Crear clase' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
