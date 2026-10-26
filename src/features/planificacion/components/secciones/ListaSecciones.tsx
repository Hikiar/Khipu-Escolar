import { Layers, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { ErrorState } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Can } from '@/components/guards/Can'
import { NIVELES, NIVEL_LABELS } from '@/lib/nivelesCurso'
import { cn } from 'cn'
import { coberturaDe } from '../../lib/secciones'
import type { usePlanificacion } from '../../hooks/usePlanificacion'
import type { Grado, Seccion, Clase } from '@/services/gradosService'
import type { Docente } from '@/services/catalogoService'
import type { AsignacionCurso } from '@/services/asignacionService'
import type { CursoGrado } from '@/services/cursosService'
import type { EstadoCarga } from '@/hooks/useCarga'

type GradoConSecciones = ReturnType<typeof usePlanificacion>['grados'][number]

export function ListaSecciones({
  gradosEstado,
  grados,
  hayFiltros = false,
  seleccionId,
  onSeleccionar,
  clasesPorSeccion,
  docentesPorId,
  planesPorGrado,
  asignacionesPorClase,
  puedeAsignaciones,
  onCrearGrado,
  onEditarGrado,
  onEliminarGrado,
  onCrearSeccion,
  onRecargarSecciones,
}: {
  gradosEstado: EstadoCarga
  grados: GradoConSecciones[]
  hayFiltros?: boolean
  seleccionId: string | null
  onSeleccionar: (id: string) => void
  clasesPorSeccion: Map<string, Clase>
  docentesPorId: Map<string, Docente>
  planesPorGrado: Record<string, CursoGrado[]>
  asignacionesPorClase: Map<string, AsignacionCurso[]>
  puedeAsignaciones: boolean
  onCrearGrado: () => void
  onEditarGrado: (grado: Grado) => void
  onEliminarGrado: (grado: Grado) => void
  onCrearSeccion: (gradoId: string) => void
  onRecargarSecciones: (gradoId: string) => void
}) {
  if (gradosEstado === 'cargando') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, indice) => (
          <Skeleton key={indice} className="h-44 w-full" />
        ))}
      </div>
    )
  }

  if (gradosEstado === 'ok' && grados.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">
            {hayFiltros
              ? 'No hay grados ni secciones que coincidan con el filtro.'
              : 'No hay grados registrados.'}
          </p>
          {!hayFiltros && (
            <Can permission="grados.crear">
              <Button size="sm" className="mt-3" onClick={onCrearGrado}>
                <Plus className="size-3.5" aria-hidden />
                Crear grado
              </Button>
            </Can>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {NIVELES.map((nivel) => {
        const gradosNivel = grados
          .filter((g) => g.nivel === nivel)
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre))
        if (gradosNivel.length === 0) return null
        return (
          <section key={nivel} className="flex flex-col gap-3">
            <h4 className="flex items-center gap-2">
              <Badge variant="outline">{NIVEL_LABELS[nivel]}</Badge>
            </h4>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gradosNivel.map((grado) => (
                <div
                  key={grado.id}
                  className="flex flex-col rounded-xl border border-border bg-card"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{grado.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {grado.codigo} · Orden {grado.orden}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Can permission="grados.crear">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Crear sección en ${grado.nombre}`}
                          onClick={() => onCrearSeccion(grado.id)}
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </Button>
                      </Can>
                      <Can permission="grados.editar">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${grado.nombre}`}
                          onClick={() => onEditarGrado(grado)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                      </Can>
                      <Can permission="grados.eliminar">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar ${grado.nombre}`}
                          onClick={() => onEliminarGrado(grado)}
                        >
                          <Trash2 className="size-3.5 text-destructive" aria-hidden />
                        </Button>
                      </Can>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-2">
                    {grado.seccionesEstado === 'cargando' && (
                      <div className="flex flex-col gap-2 p-1">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    )}
                    {grado.seccionesEstado === 'error' && (
                      <ErrorState
                        message={grado.seccionesError ?? 'No se pudieron cargar las secciones.'}
                        onRetry={() => onRecargarSecciones(grado.id)}
                      />
                    )}
                    {grado.seccionesEstado === 'ok' && (grado.secciones ?? []).length === 0 && (
                      <p className="px-2 py-3 text-xs text-muted-foreground">
                        No hay secciones en este grado.
                      </p>
                    )}
                    {grado.seccionesEstado === 'ok' &&
                      (grado.secciones ?? []).map((seccion: Seccion) => {
                        const id = `${grado.id}:${seccion.id}`
                        const clase = clasesPorSeccion.get(id)
                        const tutor = clase?.tutorDocenteId
                          ? docentesPorId.get(clase.tutorDocenteId)
                          : undefined
                        const cobertura =
                          clase && puedeAsignaciones
                            ? coberturaDe(
                                planesPorGrado[grado.id] ?? [],
                                asignacionesPorClase.get(clase.id) ?? [],
                              )
                            : null
                        const activo = seleccionId === id
                        return (
                          <button
                            key={seccion.id}
                            type="button"
                            onClick={() => onSeleccionar(id)}
                            aria-current={activo}
                            className={cn(
                              'flex w-full flex-col gap-1 rounded-md p-2 text-left outline-none transition-colors',
                              'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                              activo && 'bg-primary/5 ring-1 ring-primary',
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-medium">{seccion.nombre}</span>
                              {seccion.turno && (
                                <Badge variant="secondary">{seccion.turno}</Badge>
                              )}
                              {clase ? (
                                <Badge variant={clase.estado === 'ABIERTA' ? 'success' : 'outline'}>
                                  {clase.estado === 'ABIERTA' ? 'Activa' : 'Cerrada'}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Sin clase</Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {clase ? (
                                tutor ? (
                                  `${tutor.nombres} ${tutor.apellidos}`
                                ) : (
                                  <span className="text-warning">Falta asignar tutor</span>
                                )
                              ) : (
                                'Crea la clase para asignar tutor y docentes'
                              )}
                              {cobertura && cobertura.total > 0 && (
                                <span className="ml-2">
                                  <Users className="mr-1 inline size-3" aria-hidden />
                                  {cobertura.conDocente}/{cobertura.total}
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
