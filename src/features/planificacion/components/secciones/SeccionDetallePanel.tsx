import { useMemo, useState } from 'react'
import { Pencil, RotateCw, Trash2, Users, UserCog } from 'lucide-react'
import { ErrorState, InlineError, LoadingState } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DetalleAsignaturas } from './DetalleAsignaturas'
import { AsignarTutorDialog } from './AsignarTutorDialog'
import { AsignarDocentesDialog } from './AsignarDocentesDialog'
import { AsignarDocenteMasivoDialog } from './AsignarDocenteMasivoDialog'
import { ConfirmarCambiosDialog } from './ConfirmarCambiosDialog'
import { EliminarClaseDialog } from '../clases/EliminarClaseDialog'
import { coberturaDesdeBorrador } from '../../lib/secciones'
import type { useSeccionDetalle } from '../../hooks/useSeccionDetalle'
import type { CursoGrado } from '@/services/cursosService'
import type { Clase as ClaseGrados } from '@/services/gradosService'

/**
 * Panel de detalle de una sección (lado derecho del maestro-detalle).
 * Toda la edición de tutor y docentes ocurre aquí mediante diálogos dedicados.
 */
export function SeccionDetallePanel({
  detalle,
  onEliminada,
}: {
  detalle: ReturnType<typeof useSeccionDetalle>
  onEliminada: () => void
}) {
  const [dialogoTutor, setDialogoTutor] = useState(false)
  const [cursoAsignar, setCursoAsignar] = useState<CursoGrado | null>(null)
  const [dialogoMasivo, setDialogoMasivo] = useState(false)
  const [dialogoConfirmar, setDialogoConfirmar] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const plan = detalle.plan ?? []
  const borrador = detalle.borrador
  const clase = detalle.clase

  const opcionesTutor = useMemo(() => {
    const lista = [...detalle.docentesHabilitados]
    const actualId = borrador?.tutorDocenteId
    if (actualId && !lista.some((docente) => docente.id === actualId)) {
      const actual = detalle.docentesPorId.get(actualId)
      if (actual) lista.unshift(actual)
    }
    return lista
  }, [detalle.docentesHabilitados, detalle.docentesPorId, borrador?.tutorDocenteId])

  const claseParaEliminar = useMemo<ClaseGrados | null>(
    () =>
      clase
        ? { ...clase, tutorDocenteId: clase.tutorDocenteId ?? null }
        : null,
    [clase],
  )

  if (detalle.estado === 'cargando') {
    return <LoadingState variant="card" rows={3} />
  }

  if (detalle.estado === 'error' || detalle.notEncontrada || !clase) {
    return (
      <ErrorState
        message={
          detalle.notEncontrada
            ? 'No se encontró la sección solicitada.'
            : detalle.error ?? 'No se pudo cargar la sección.'
        }
        onRetry={detalle.recargar}
      />
    )
  }

  const tutorId = borrador?.tutorDocenteId ?? null
  const tutor = tutorId ? detalle.docentesPorId.get(tutorId) ?? null : null
  const cobertura = coberturaDesdeBorrador(plan, detalle.editando ? borrador : detalle.base)
  const estadoActual = borrador?.estado ?? clase.estado
  const pendientes = plan.filter(
    (curso) => (borrador?.docentesPorCurso[curso.cursoId] ?? []).length === 0,
  ).length

  const manejarEliminar = async () => {
    const ok = await detalle.eliminar()
    if (ok) onEliminada()
  }

  const aplicarDocentes = (cursoId: string, docentesIds: string[]) => {
    const actuales = borrador?.docentesPorCurso[cursoId] ?? []
    for (const id of actuales) {
      if (!docentesIds.includes(id)) detalle.quitarDocente(cursoId, id)
    }
    for (const id of docentesIds) {
      if (!actuales.includes(id)) detalle.agregarDocente(cursoId, id)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {clase.gradoNombre} · {clase.seccionNombre}
          </h3>
          <p className="text-sm text-muted-foreground">
            Año lectivo {clase.periodoCodigo} · Turno {clase.turno}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {detalle.editando ? (
            <>
              <Button variant="outline" onClick={detalle.cancelarEdicion} disabled={detalle.guardando}>
                Cancelar
              </Button>
              <Button
                onClick={() => setDialogoConfirmar(true)}
                disabled={detalle.guardando || !detalle.sucio}
              >
                {detalle.guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={detalle.recargar}>
                <RotateCw className="size-4" aria-hidden />
                Recargar
              </Button>
              {detalle.puedeEliminarClase && (
                <Button variant="outline" onClick={() => setConfirmarEliminar(true)}>
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                  Eliminar
                </Button>
              )}
              {detalle.puedeEditar && (
                <Button onClick={detalle.abrirEdicion}>
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {detalle.errorGuardado && <InlineError message={detalle.errorGuardado} />}

      <Card>
        <CardHeader>
          <CardTitle>Resumen de la sección</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Tutor</p>
            {detalle.editando && detalle.puedeEditarTutor ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'Sin tutor'}
                </span>
                <Button variant="outline" size="sm" onClick={() => setDialogoTutor(true)}>
                  <UserCog className="size-3.5" aria-hidden />
                  Cambiar
                </Button>
              </div>
            ) : tutor ? (
              <p className="text-sm">{`${tutor.nombres} ${tutor.apellidos}`}</p>
            ) : (
              <p className="text-sm text-warning">Falta asignar tutor</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Estado</p>
            {detalle.editando && detalle.puedeEditarClase ? (
              <Select value={estadoActual} onValueChange={detalle.cambiarEstado}>
                <SelectTrigger className="w-full" aria-label="Estado de la sección">
                  <SelectValue>
                    {(value: string) => (value === 'CERRADA' ? 'Cerrada' : 'Activa')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABIERTA">Activa</SelectItem>
                  <SelectItem value="CERRADA">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={estadoActual === 'ABIERTA' ? 'success' : 'outline'}>
                {estadoActual === 'ABIERTA' ? 'Activa' : 'Cerrada'}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Año lectivo</p>
            <p className="text-sm">{clase.periodoCodigo}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Cupos disponibles</p>
            {detalle.editando && detalle.puedeEditarClase ? (
              <Input
                type="number"
                min="1"
                max="50"
                value={borrador?.vacantes ?? clase.vacantes}
                aria-label="Cupos disponibles de la sección"
                onChange={(e) => detalle.cambiarVacantes(Math.max(1, Number(e.target.value) || 1))}
              />
            ) : (
              <p className="text-sm">{borrador?.vacantes ?? clase.vacantes}</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Cobertura</p>
            {cobertura ? (
              cobertura.total === 0 ? (
                <p className="text-sm text-muted-foreground">Sin asignaturas en el plan</p>
              ) : (
                <p className="text-sm">
                  {cobertura.conDocente} de {cobertura.total} asignaturas con docente
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No disponible</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaturas y docentes</CardTitle>
          {detalle.editando && detalle.puedeAgregarAsignacion && pendientes > 0 && (
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setDialogoMasivo(true)}>
                <Users className="size-4" aria-hidden />
                Asignar a las {pendientes} pendientes
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {detalle.editando && !detalle.puedeProfesores && (
            <p className="text-sm text-muted-foreground">
              No tienes permiso para ver el listado de docentes.
            </p>
          )}
          <DetalleAsignaturas
            plan={plan}
            borrador={borrador}
            docentesPorId={detalle.docentesPorId}
            editando={detalle.editando}
            puedeAgregar={detalle.puedeAgregarAsignacion}
            puedeQuitar={detalle.puedeQuitarAsignacion}
            puedeAsignaciones={detalle.puedeAsignaciones}
            onAbrirAsignar={setCursoAsignar}
            onQuitar={detalle.quitarDocente}
          />
        </CardContent>
      </Card>

      <AsignarTutorDialog
        abierto={dialogoTutor}
        tutorActualId={tutorId}
        docentes={opcionesTutor}
        onCerrar={() => setDialogoTutor(false)}
        onConfirmar={(docenteId) => {
          detalle.cambiarTutor(docenteId)
          setDialogoTutor(false)
        }}
      />

      <AsignarDocentesDialog
        abierto={cursoAsignar !== null}
        cursoNombre={cursoAsignar?.cursoNombre ?? ''}
        seleccionados={
          cursoAsignar ? borrador?.docentesPorCurso[cursoAsignar.cursoId] ?? [] : []
        }
        docentes={detalle.docentesHabilitados}
        onCerrar={() => setCursoAsignar(null)}
        onConfirmar={(docentesIds) => {
          if (cursoAsignar) aplicarDocentes(cursoAsignar.cursoId, docentesIds)
          setCursoAsignar(null)
        }}
      />

      <AsignarDocenteMasivoDialog
        abierto={dialogoMasivo}
        pendientes={pendientes}
        docentes={detalle.docentesHabilitados}
        onCerrar={() => setDialogoMasivo(false)}
        onConfirmar={(docenteId) => {
          detalle.asignarDocenteATodas(docenteId)
          setDialogoMasivo(false)
        }}
      />

      <ConfirmarCambiosDialog
        abierto={dialogoConfirmar}
        base={detalle.base}
        borrador={borrador}
        plan={plan}
        docentesPorId={detalle.docentesPorId}
        guardando={detalle.guardando}
        onCerrar={() => setDialogoConfirmar(false)}
        onConfirmar={() => {
          void detalle.guardar().then((ok) => {
            if (ok) setDialogoConfirmar(false)
          })
        }}
      />

      <EliminarClaseDialog
        clasePorEliminar={confirmarEliminar ? claseParaEliminar : null}
        setClasePorEliminar={(valor) => {
          if (!valor) setConfirmarEliminar(false)
        }}
        eliminandoClase={detalle.eliminando}
        manejarEliminarClase={() => void manejarEliminar()}
      />
    </div>
  )
}
