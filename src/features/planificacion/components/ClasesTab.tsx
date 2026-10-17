import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Can } from '@/components/guards/Can'
import { Plus } from 'lucide-react'
import { useClasesTab } from '../hooks/useClasesTab'
import { ClasesTabla } from './clases/ClasesTabla'
import { ClaseFormDialog } from './clases/ClaseFormDialog'
import { EliminarClaseDialog } from './clases/EliminarClaseDialog'


export function ClasesTab() {
  const cl = useClasesTab()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Clases</h3>
          <p className="text-sm text-muted-foreground">
            Grupos de estudiantes con tutor asignado por año lectivo
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <Can permission="grados.crear">
            <Button onClick={cl.abrirDialogoCrearClase} disabled={!cl.periodo || !cl.gradoSeleccionado}>
              <Plus className="size-4 mr-2" aria-hidden />
              Crear clase
            </Button>
          </Can>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full max-w-xs">
          <Label htmlFor="clase-filtro-periodo" className="mb-1.5 block">Filtrar por año lectivo</Label>
          <Select value={cl.filtroPeriodoId} onValueChange={cl.setFiltroPeriodoId}>
            <SelectTrigger id="clase-filtro-periodo">
              <SelectValue placeholder={cl.periodo ? `Actual: ${cl.periodo.nombre}` : 'Todos los periodos'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los años lectivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full max-w-xs">
          <Label htmlFor="clase-filtro-grado" className="mb-1.5 block">Grado</Label>
          <Select value={cl.gradoLocal} onValueChange={cl.setGradoLocal}>
            <SelectTrigger id="clase-filtro-grado">
              <SelectValue placeholder="Seleccionar grado" />
            </SelectTrigger>
            <SelectContent>
              {cl.grados.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.codigo} — {g.nombre} <span className="text-muted-foreground">({g.nivel})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ClasesTabla
        clasesEstado={cl.clasesEstado}
        clasesMostradas={cl.clasesMostradas}
        docentes={cl.docentes}
        periodo={cl.periodo}
        gradoSeleccionado={cl.gradoSeleccionado}
        onCrear={cl.abrirDialogoCrearClase}
        onEditar={cl.abrirDialogoEditarClase}
        onEliminar={cl.abrirConfirmarEliminarClase}
      />

      <ClaseFormDialog
        dialogoClase={cl.dialogoClase}
        cerrarDialogoClase={cl.cerrarDialogoClase}
        formClase={cl.formClase}
        setFormClase={cl.setFormClase}
        formClaseErrores={cl.formClaseErrores}
        formClaseEnviando={cl.formClaseEnviando}
        enviarClase={cl.enviarClase}
        periodo={cl.periodo}
        docentes={cl.docentes}
        grados={cl.grados}
        seccionesParaSelect={cl.seccionesParaSelect}
        cargarSeccionesParaGrado={cl.cargarSeccionesParaGrado}
      />

      <EliminarClaseDialog
        clasePorEliminar={cl.clasePorEliminar}
        setClasePorEliminar={cl.setClasePorEliminar}
        eliminandoClase={cl.eliminandoClase}
        manejarEliminarClase={cl.manejarEliminarClase}
      />
    </div>
  )
}
