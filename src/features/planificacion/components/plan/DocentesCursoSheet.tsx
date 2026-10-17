import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Users } from 'lucide-react'
import type { CursoGrado } from '@/services/cursosService'
import type { AsignacionCurso } from '@/services/asignacionService'
import type { Grado } from '@/services/gradosService'

export function DocentesCursoSheet({
  cursoParaDocentes,
  setCursoParaDocentes,
  setDocentesCurso,
  docentesCurso,
  docentesCargando,
  gradoSeleccionado,
}: {
  cursoParaDocentes: CursoGrado | null
  setCursoParaDocentes: (valor: CursoGrado | null) => void
  setDocentesCurso: (valor: AsignacionCurso[]) => void
  docentesCurso: AsignacionCurso[]
  docentesCargando: boolean
  gradoSeleccionado: Grado | null
}) {
  const cerrar = () => {
    setCursoParaDocentes(null)
    setDocentesCurso([])
  }

  return (
    <Sheet open={cursoParaDocentes !== null} onOpenChange={(open) => { if (!open) cerrar() }}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Docentes de {cursoParaDocentes?.cursoNombre}</SheetTitle>
          <SheetDescription>
            Asignaciones de la asignatura <strong>{cursoParaDocentes?.cursoCodigo}</strong> en <strong>{gradoSeleccionado?.nombre}</strong>
          </SheetDescription>
        </SheetHeader>

        {docentesCargando ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : docentesCurso.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="size-12 mx-auto mb-2" aria-hidden />
            <p>No hay docentes asignados a esta asignatura en este grado</p>
            <p className="text-sm mt-1">Las asignaciones se gestionan en la pestaña "Asignaciones"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docentesCurso.map((a) => (
              <div key={`${a.claseId}-${a.docenteId}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="font-medium">{a.docente.nombres} {a.docente.apellidos}</p>
                    <p className="text-sm text-muted-foreground">DNI: {a.docente.dni}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{a.clase.seccionNombre}</span>
                  <Badge variant="secondary">{a.clase.periodoCodigo}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={cerrar}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
