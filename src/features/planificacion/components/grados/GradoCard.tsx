import { ErrorState, FilasSkeleton } from '@/components/common'
import {
  Card,
  CardHeader,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/guards/Can'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Grado, Seccion } from '@/services/gradosService'
import type { usePlanificacion } from '../../hooks/usePlanificacion'

type GradoConSecciones = ReturnType<typeof usePlanificacion>['grados'][number]

export function GradoCard({
  grado,
  gradoSeleccionado,
  setGradoSeleccionado,
  recargarSecciones,
  abrirDialogoEditarGrado,
  setGradoPorEliminar,
  abrirDialogoCrearSeccion,
  abrirDialogoEditarSeccion,
  abrirConfirmarEliminarSeccion,
}: {
  grado: GradoConSecciones
  gradoSeleccionado: Grado | null
  setGradoSeleccionado: (grado: Grado | null) => void
  recargarSecciones: (gradoId: string) => Promise<void>
  abrirDialogoEditarGrado: (grado: Grado) => void
  setGradoPorEliminar: (grado: Grado | null) => void
  abrirDialogoCrearSeccion: (gradoId: string) => void
  abrirDialogoEditarSeccion: (gradoId: string, seccion: Seccion) => void
  abrirConfirmarEliminarSeccion: (gradoId: string, seccion: Seccion) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGradoSeleccionado(gradoSeleccionado?.id === grado.id ? null : grado)}
              aria-expanded={gradoSeleccionado?.id === grado.id}
              aria-controls={`secciones-${grado.id}`}
            >
              {gradoSeleccionado?.id === grado.id ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{grado.nombre}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{grado.codigo} · Orden: {grado.orden}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Can permission="grados.editar">
              <Button variant="ghost" size="sm" onClick={() => abrirDialogoEditarGrado(grado)}>
                <Edit className="size-4" aria-hidden />
                Editar
              </Button>
            </Can>
            <Can permission="grados.eliminar">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGradoPorEliminar(grado)}
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </Button>
            </Can>
          </div>
        </div>
      </CardHeader>

      <div
        id={`secciones-${grado.id}`}
        role="region"
        aria-label={`Secciones del grado ${grado.nombre}`}
        className={`overflow-hidden transition-all duration-200 ${
          gradoSeleccionado?.id === grado.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Secciones</h4>
            <Can permission="grados.crear">
              <Button size="sm" onClick={() => abrirDialogoCrearSeccion(grado.id)}>
                <Plus className="size-3.5" aria-hidden />
                Crear sección
              </Button>
            </Can>
          </div>

          {grado.seccionesEstado === 'cargando' && (
            <Table aria-busy="true" className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={3} />
              </TableBody>
            </Table>
          )}

          {grado.seccionesEstado === 'error' && (
            <ErrorState
              message={grado.seccionesError ?? 'No se pudieron cargar las secciones.'}
              onRetry={() => void recargarSecciones(grado.id)}
            />
          )}

          {grado.seccionesEstado === 'ok' && grado.secciones.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay secciones en este grado.
            </p>
          )}

          {grado.seccionesEstado === 'ok' && grado.secciones.length > 0 && (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grado.secciones.map((seccion) => (
                  <TableRow key={seccion.id}>
                    <TableCell className="font-medium">{seccion.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{seccion.turno || '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Can permission="grados.editar">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => abrirDialogoEditarSeccion(grado.id, seccion)}
                          >
                            Editar
                          </Button>
                        </Can>
                        <Can permission="grados.eliminar">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => abrirConfirmarEliminarSeccion(grado.id, seccion)}
                          >
                            <Trash2 className="size-3" aria-hidden />
                            Eliminar
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Card>
  )
}
