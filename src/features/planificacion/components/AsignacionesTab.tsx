import { ErrorState, FilasSkeleton } from '@/components/common'
import { UserCheck, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Can } from '@/components/guards/Can'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useAsignacionesTab } from '../hooks/useAsignacionesTab'
import { AsignacionFormDialog } from './asignaciones/AsignacionFormDialog'
import { EliminarAsignacionDialog } from './asignaciones/EliminarAsignacionDialog'

export function AsignacionesTab() {
  const {
    clases,
    asignaciones,
    estado,
    error,
    dialogoCrear,
    setDialogoCrear,
    creando,
    asignandoMasivo,
    claseSeleccionada,
    cursoSeleccionado,
    setCursoSeleccionado,
    docenteSeleccionado,
    setDocenteSeleccionado,
    cursosDeClase,
    cursosCargando,
    asignacionAEliminar,
    setAsignacionAEliminar,
    eliminando,
    docentesFiltrados,
    reintentar,
    abrirDialogoNuevaAsignacion,
    cambiarClase,
    enviarCrear,
    enviarMasivo,
    enviarEliminar,
  } = useAsignacionesTab()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asignación de docentes"
        description="Docentes asignados a asignaturas por clase"
        icon={<UserCheck className="size-5" />}
        actions={
          <Can permission="asignaciones.crear">
            <Button onClick={abrirDialogoNuevaAsignacion}>
              <Plus className="size-4" aria-hidden />
              Nueva asignación
            </Button>
          </Can>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asignaciones registradas</CardTitle>
          <CardDescription>
            {estado === 'ok' && asignaciones.length > 0
              ? `${asignaciones.length} asignación${asignaciones.length !== 1 ? 'es' : ''}`
              : 'Relación docente-asignatura-clase'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estado === 'error' && (
            <ErrorState
              message={error ?? 'No se pudieron cargar las asignaciones.'}
              onRetry={reintentar}
            />
          )}

          {estado === 'cargando' && (
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={4} />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && asignaciones.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay asignaciones registradas.
            </p>
          )}

          {estado === 'ok' && asignaciones.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaciones.map((a) => (
                  <TableRow key={`${a.claseId}-${a.cursoId}-${a.docenteId}`}>
                    <TableCell className="font-medium">
                      {a.clase.gradoNombre} {a.clase.seccionNombre}
                      <span className="text-muted-foreground"> · {a.clase.periodoCodigo}</span>
                    </TableCell>
                    <TableCell>
                      {a.curso.codigo} — {a.curso.nombre}
                    </TableCell>
                    <TableCell>
                      {a.docente.nombres} {a.docente.apellidos}
                      <span className="text-muted-foreground"> · {a.docente.dni}</span>
                    </TableCell>
                    <TableCell>
                      <Can permission="asignaciones.eliminar">
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          disabled={eliminando}
                          aria-label={`Eliminar asignación de la asignatura ${a.curso.nombre}`}
                          onClick={() => setAsignacionAEliminar(a)}
                        >
                          <Trash2 className="size-3" aria-hidden />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AsignacionFormDialog
        abierto={dialogoCrear}
        onOpenChange={setDialogoCrear}
        clases={clases}
        claseSeleccionada={claseSeleccionada}
        onClaseChange={(v) => void cambiarClase(v)}
        cursoSeleccionado={cursoSeleccionado}
        setCursoSeleccionado={setCursoSeleccionado}
        docenteSeleccionado={docenteSeleccionado}
        setDocenteSeleccionado={setDocenteSeleccionado}
        cursosDeClase={cursosDeClase}
        cursosCargando={cursosCargando}
        docentesFiltrados={docentesFiltrados}
        creando={creando}
        asignandoMasivo={asignandoMasivo}
        onMasivo={() => void enviarMasivo()}
        onCrear={() => void enviarCrear()}
      />

      <EliminarAsignacionDialog
        objetivo={asignacionAEliminar}
        eliminando={eliminando}
        onCancelar={() => setAsignacionAEliminar(null)}
        onConfirmar={() => void enviarEliminar()}
      />
    </div>
  )
}
