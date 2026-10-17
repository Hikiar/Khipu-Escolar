import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InlineError } from '@/components/common'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { Curso, CursoGrado } from '@/services/cursosService'
import type { AsignacionCurso } from '@/services/asignacionService'

export function DetalleAsignaturaSheet({
  cursoDetalle,
  detalleCurso,
  detalleCursoCargando,
  detalleCursoError,
  docentesCurso,
  cerrarDetalleCurso,
}: {
  cursoDetalle: CursoGrado | null
  detalleCurso: Curso | null
  detalleCursoCargando: boolean
  detalleCursoError: string | null
  docentesCurso: AsignacionCurso[]
  cerrarDetalleCurso: () => void
}) {
  return (
    <Sheet
      open={cursoDetalle !== null}
      onOpenChange={(o) => {
        if (!o) cerrarDetalleCurso()
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {cursoDetalle?.cursoNombre ?? 'Detalle de asignatura'}
          </SheetTitle>
          <SheetDescription>
            {cursoDetalle?.cursoCodigo
              ? `Código ${cursoDetalle.cursoCodigo}`
              : 'Información del catálogo de asignaturas'}
          </SheetDescription>
        </SheetHeader>

        {detalleCursoCargando && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}

        {!detalleCursoCargando && detalleCursoError && (
          <InlineError message={detalleCursoError} />
        )}

        {!detalleCursoCargando && !detalleCursoError && detalleCurso && (
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="font-medium">{detalleCurso.nombre}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-medium">{detalleCurso.codigo}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Descripción</dt>
              <dd>{detalleCurso.descripcion ?? <span className="text-muted-foreground">Sin descripción</span>}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estado</dt>
              <dd>
                <Badge variant={detalleCurso.activo ? 'success' : 'outline'}>
                  {detalleCurso.activo ? 'Activa' : 'Inactiva'}
                </Badge>
              </dd>
            </div>
            {cursoDetalle?.horasSemana != null && (
              <div>
                <dt className="text-muted-foreground">Horas semanales en este grado</dt>
                <dd className="font-medium">{cursoDetalle.horasSemana}</dd>
              </div>
            )}
            {cursoDetalle?.orden != null && (
              <div>
                <dt className="text-muted-foreground">Orden en el plan</dt>
                <dd className="font-medium">{cursoDetalle.orden}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Docentes asignados en este grado</dt>
              <dd className="font-medium">
                {cursoDetalle
                  ? docentesCurso.filter((a) => a.cursoId === cursoDetalle.cursoId).length
                  : 0}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-4 pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={cerrarDetalleCurso}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
