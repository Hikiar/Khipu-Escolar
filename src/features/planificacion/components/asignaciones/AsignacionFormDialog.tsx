import { CampoFormulario } from '@/components/common'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Layers } from 'lucide-react'
import { etiquetaNiveles } from '@/lib/nivelesCurso'
import type { Clase, Curso, Docente } from '@/services/catalogoService'

export function AsignacionFormDialog({
  abierto,
  onOpenChange,
  clases,
  claseSeleccionada,
  onClaseChange,
  cursoSeleccionado,
  setCursoSeleccionado,
  docenteSeleccionado,
  setDocenteSeleccionado,
  cursosDeClase,
  cursosCargando,
  docentesFiltrados,
  creando,
  asignandoMasivo,
  onMasivo,
  onCrear,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  clases: Clase[]
  claseSeleccionada: string
  onClaseChange: (claseId: string) => void
  cursoSeleccionado: string
  setCursoSeleccionado: (valor: string) => void
  docenteSeleccionado: string
  setDocenteSeleccionado: (valor: string) => void
  cursosDeClase: Curso[]
  cursosCargando: boolean
  docentesFiltrados: Docente[]
  creando: boolean
  asignandoMasivo: boolean
  onMasivo: () => void
  onCrear: () => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva asignación</DialogTitle>
          <DialogDescription>Asigne un docente a una asignatura en una clase específica</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <CampoFormulario label="Clase" id="asig-clase" required>
            <Select value={claseSeleccionada} onValueChange={(v) => onClaseChange(v)}>
              <SelectTrigger id="asig-clase" className="w-full">
                <SelectValue placeholder="Seleccionar clase" />
              </SelectTrigger>
              <SelectContent>
                {clases.map((cl) => (
                  <SelectItem key={cl.id} value={cl.id}>
                    {cl.gradoNombre} {cl.seccionNombre} — {cl.periodoCodigo} ({cl.turno})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CampoFormulario>

          <CampoFormulario label="Asignatura" id="asig-curso" required>
            <Select
              value={cursoSeleccionado}
              disabled={!claseSeleccionada || cursosCargando}
              onValueChange={setCursoSeleccionado}
            >
              <SelectTrigger id="asig-curso" className="w-full">
                <SelectValue
                  placeholder={claseSeleccionada ? (cursosCargando ? 'Cargando...' : 'Seleccionar asignatura') : 'Primero seleccione una clase'}
                />
              </SelectTrigger>
              <SelectContent>
                {cursosDeClase.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} — {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CampoFormulario>

          <CampoFormulario label="Docente" id="asig-docente" required>
            <Select value={docenteSeleccionado} onValueChange={setDocenteSeleccionado}>
              <SelectTrigger id="asig-docente" className="w-full">
                <SelectValue placeholder="Seleccionar docente" />
              </SelectTrigger>
              <SelectContent>
                {docentesFiltrados.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombres} {d.apellidos} — {etiquetaNiveles(d.niveles)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CampoFormulario>
        </div>

        {claseSeleccionada && docenteSeleccionado && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              ¿Tutor generalista de Primaria? Asigne todas las asignaturas de una vez con un solo clic.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onMasivo}
              disabled={asignandoMasivo || creando}
            >
              <Layers className="size-4" aria-hidden />
              {asignandoMasivo ? 'Asignando...' : 'Asignar todas las asignaturas de la clase'}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creando}>
            Cancelar
          </Button>
          <Button
            onClick={onCrear}
            disabled={creando || !claseSeleccionada || !cursoSeleccionado || !docenteSeleccionado}
          >
            {creando ? 'Creando...' : 'Crear asignación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
