import { Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Docente } from '@/services/catalogoService'
import type { CursoGrado } from '@/services/cursosService'
import type { BorradorSeccion } from '../../lib/secciones'

function nombreDocente(docente: Docente | undefined): string {
  return docente ? `${docente.nombres} ${docente.apellidos}` : 'Docente'
}

export function DetalleAsignaturas({
  plan,
  borrador,
  docentesPorId,
  editando,
  puedeAgregar,
  puedeQuitar,
  puedeAsignaciones,
  onAbrirAsignar,
  onQuitar,
}: {
  plan: CursoGrado[]
  borrador: BorradorSeccion | null
  docentesPorId: Map<string, Docente>
  editando: boolean
  puedeAgregar: boolean
  puedeQuitar: boolean
  puedeAsignaciones: boolean
  onAbrirAsignar: (curso: CursoGrado) => void
  onQuitar: (cursoId: string, docenteId: string) => void
}) {
  if (plan.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        El plan de estudios de este grado no tiene asignaturas registradas.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!puedeAsignaciones && (
        <p className="text-sm text-muted-foreground">
          No tienes permiso para ver las asignaciones docentes.
        </p>
      )}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asignatura</TableHead>
              <TableHead>Docente(s)</TableHead>
              {editando && puedeAgregar && <TableHead className="w-40">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.map((curso) => {
              const ids = borrador?.docentesPorCurso[curso.cursoId] ?? []
              return (
                <TableRow key={curso.cursoId}>
                  <TableCell className="whitespace-normal">
                    <span className="text-muted-foreground">{curso.cursoCodigo}</span>{' '}
                    {curso.cursoNombre}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {!puedeAsignaciones ? (
                      <span className="text-muted-foreground">—</span>
                    ) : ids.length === 0 ? (
                      <span className="text-warning">Falta asignar docente</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {ids.map((docenteId) => (
                          <Badge key={docenteId} variant="secondary" className="gap-1">
                            {nombreDocente(docentesPorId.get(docenteId))}
                            {editando && puedeQuitar && (
                              <button
                                type="button"
                                onClick={() => onQuitar(curso.cursoId, docenteId)}
                                className="rounded-full outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Quitar a ${nombreDocente(docentesPorId.get(docenteId))} de ${curso.cursoNombre}`}
                              >
                                <X className="size-3" aria-hidden />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  {editando && puedeAgregar && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAbrirAsignar(curso)}
                      >
                        <Users className="size-3.5" aria-hidden />
                        {ids.length === 0 ? 'Asignar' : 'Editar'}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
