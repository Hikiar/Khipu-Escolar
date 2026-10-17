import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, BookOpen } from 'lucide-react'
import { usePlanEstudios } from '../hooks/usePlanEstudios'
import { PlanEstudiosCursosTable } from './plan/PlanEstudiosCursosTable'
import { AgregarAsignaturaDialog } from './plan/AgregarAsignaturaDialog'
import { EditarAsignaturaDialog } from './plan/EditarAsignaturaDialog'
import { QuitarAsignaturaDialog } from './plan/QuitarAsignaturaDialog'
import { DocentesCursoSheet } from './plan/DocentesCursoSheet'
import { DetalleAsignaturaSheet } from './plan/DetalleAsignaturaSheet'

export function PlanEstudiosTab() {
  const plan = usePlanEstudios()
  const {
    gradoSeleccionado,
    grados,
    handleGradoChange,
    cursosDeGrado,
    cursosDeGradoEstado,
    dialogoAgregar,
    setDialogoAgregar,
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
    dialogoEditar,
    editHorasSemana,
    setEditHorasSemana,
    editOrden,
    setEditOrden,
    editEnviando,
    dialogoQuitar,
    quitando,
    docentesCurso,
    docentesCargando,
    cursoParaDocentes,
    setCursoParaDocentes,
    setDocentesCurso,
    cursoDetalle,
    detalleCurso,
    detalleCursoCargando,
    detalleCursoError,
    abrirDialogoAgregar,
    cerrarDialogoAgregar,
    abrirDialogoEditar,
    cerrarDialogoEditar,
    abrirDialogoQuitar,
    cerrarDialogoQuitar,
    enviarAgregar,
    enviarEditar,
    enviarQuitar,
    abrirDocentes,
    abrirDetalleCurso,
    cerrarDetalleCurso,
  } = plan

  if (!gradoSeleccionado) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="size-12 mx-auto text-muted-foreground/50" aria-hidden />
          <h4 className="mt-4 text-lg font-medium">Selecciona un grado</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Elige un grado para ver y gestionar su plan de estudios
          </p>
{grados.length > 0 && (
              <div className="max-w-xs mx-auto">
                <Label htmlFor="selector-grado-vacio" className="mb-2 block text-sm font-medium">
                  Grado
                </Label>
                <Select value={gradoSeleccionado?.id ?? ''} onValueChange={handleGradoChange}>
                  <SelectTrigger id="selector-grado-vacio" className="w-full">
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
            )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Plan de estudios</h3>
            {grados.length > 0 && (
              <Select value={gradoSeleccionado?.id ?? ''} onValueChange={handleGradoChange}>
                <SelectTrigger className="w-64">
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
            )}
          </div>
          {gradoSeleccionado && (
            <p className="text-sm text-muted-foreground mt-1">
              {gradoSeleccionado.nombre} ({gradoSeleccionado.codigo}) · Asignaturas del plan con sus horas semanales y orden
            </p>
          )}
        </div>
        <Can permission="cursos.editar">
          <Button onClick={() => void abrirDialogoAgregar()} disabled={!gradoSeleccionado}>
            <Plus className="size-4 mr-2" aria-hidden />
            Añadir asignatura al plan
          </Button>
        </Can>
      </div>

      {cursosDeGradoEstado === 'ok' && cursosDeGrado.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="size-12 mx-auto text-muted-foreground/50" aria-hidden />
            <h4 className="mt-4 text-lg font-medium">Sin asignaturas en el plan</h4>
            <p className="text-sm text-muted-foreground">
              Añade asignaturas a este grado para definir su currícula
            </p>
            <Can permission="cursos.editar">
              <Button onClick={() => void abrirDialogoAgregar()} className="mt-4">
                <Plus className="size-4 mr-2" aria-hidden />
                Añadir asignatura al plan
              </Button>
            </Can>
          </CardContent>
        </Card>
      )}

      <PlanEstudiosCursosTable
        cursosDeGradoEstado={cursosDeGradoEstado}
        cursosDeGrado={cursosDeGrado}
        docentesCurso={docentesCurso}
        docentesCargando={docentesCargando}
        cursoParaDocentes={cursoParaDocentes}
        abrirDetalleCurso={(cg) => void abrirDetalleCurso(cg)}
        abrirDocentes={abrirDocentes}
        abrirDialogoEditar={abrirDialogoEditar}
        abrirDialogoQuitar={abrirDialogoQuitar}
      />

      <AgregarAsignaturaDialog
        dialogoAgregar={dialogoAgregar}
        setDialogoAgregar={setDialogoAgregar}
        cerrarDialogoAgregar={cerrarDialogoAgregar}
        formCursoId={formCursoId}
        setFormCursoId={setFormCursoId}
        formHorasSemana={formHorasSemana}
        setFormHorasSemana={setFormHorasSemana}
        formOrden={formOrden}
        setFormOrden={setFormOrden}
        formAgregarError={formAgregarError}
        formAgregarEnviando={formAgregarEnviando}
        catalogoCursos={catalogoCursos}
        catalogoCursosCargando={catalogoCursosCargando}
        gradoSeleccionado={gradoSeleccionado}
        enviarAgregar={enviarAgregar}
      />

      <EditarAsignaturaDialog
        dialogoEditar={dialogoEditar}
        cerrarDialogoEditar={cerrarDialogoEditar}
        editHorasSemana={editHorasSemana}
        setEditHorasSemana={setEditHorasSemana}
        editOrden={editOrden}
        setEditOrden={setEditOrden}
        editEnviando={editEnviando}
        gradoSeleccionado={gradoSeleccionado}
        enviarEditar={enviarEditar}
      />

      <QuitarAsignaturaDialog
        dialogoQuitar={dialogoQuitar}
        cerrarDialogoQuitar={cerrarDialogoQuitar}
        quitando={quitando}
        gradoSeleccionado={gradoSeleccionado}
        enviarQuitar={enviarQuitar}
      />

      <DocentesCursoSheet
        cursoParaDocentes={cursoParaDocentes}
        setCursoParaDocentes={setCursoParaDocentes}
        setDocentesCurso={setDocentesCurso}
        docentesCurso={docentesCurso}
        docentesCargando={docentesCargando}
        gradoSeleccionado={gradoSeleccionado}
      />

      <DetalleAsignaturaSheet
        cursoDetalle={cursoDetalle}
        detalleCurso={detalleCurso}
        detalleCursoCargando={detalleCursoCargando}
        detalleCursoError={detalleCursoError}
        docentesCurso={docentesCurso}
        cerrarDetalleCurso={cerrarDetalleCurso}
      />
    </div>
  )
}
