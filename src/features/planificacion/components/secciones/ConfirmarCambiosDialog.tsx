import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, UserPlus, UserMinus } from 'lucide-react'
import type { Docente } from '@/services/catalogoService'
import type { CursoGrado } from '@/services/cursosService'
import {
  resumenCambios,
  tieneCambios,
  type BorradorSeccion,
} from '../../lib/secciones'
import { nombreDocente } from './AsignarTutorDialog'

function Fila({
  etiqueta,
  antes,
  despues,
}: {
  etiqueta: string
  antes: string
  despues: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
      <span className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground line-through">{antes}</span>
        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="font-medium">{despues}</span>
      </span>
    </div>
  )
}

/**
 * Resumen de los cambios del borrador antes de confirmarlos contra el servidor.
 */
export function ConfirmarCambiosDialog({
  abierto,
  base,
  borrador,
  plan,
  docentesPorId,
  guardando,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean
  base: BorradorSeccion | null
  borrador: BorradorSeccion | null
  plan: CursoGrado[]
  docentesPorId: Map<string, Docente>
  guardando: boolean
  onCerrar: () => void
  onConfirmar: () => void
}) {
  const resumen = useMemo(
    () => (base && borrador ? resumenCambios(base, borrador) : null),
    [base, borrador],
  )

  const nombreCurso = (cursoId: string) =>
    plan.find((curso) => curso.cursoId === cursoId)?.cursoNombre ?? cursoId

  const nombreDeDocente = (docenteId: string) => {
    const docente = docentesPorId.get(docenteId)
    return docente ? nombreDocente(docente) : 'Docente'
  }

  const nombreTutor = (docenteId: string | null) =>
    docenteId ? nombreDeDocente(docenteId) : 'Sin tutor'

  const sinCambios = !resumen || !tieneCambios(resumen)

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) onCerrar() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmar cambios</DialogTitle>
          <DialogDescription>
            Revisa el resumen antes de guardar. Los cambios se aplican al confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 px-4 pb-2 max-h-96 overflow-y-auto">
          {sinCambios && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay cambios que guardar.
            </p>
          )}

          {resumen?.tutor && (
            <Fila
              etiqueta="Tutor"
              antes={nombreTutor(resumen.tutorAntes)}
              despues={nombreTutor(resumen.tutorDespues)}
            />
          )}
          {resumen?.estado && (
            <Fila
              etiqueta="Estado"
              antes={resumen.estadoAntes === 'ABIERTA' ? 'Activa' : 'Cerrada'}
              despues={resumen.estadoDespues === 'ABIERTA' ? 'Activa' : 'Cerrada'}
            />
          )}
          {resumen?.vacantes && (
            <Fila
              etiqueta="Cupos"
              antes={String(resumen.vacantesAntes)}
              despues={String(resumen.vacantesDespues)}
            />
          )}

          {resumen && resumen.asignaciones.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Docentes por asignatura</p>
              <div className="grid gap-2">
                {resumen.asignaciones.map((cambio, indice) => (
                  <div
                    key={`${cambio.tipo}-${cambio.cursoId}-${cambio.docenteId}-${indice}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm">{nombreCurso(cambio.cursoId)}</span>
                    <span className="flex items-center gap-2 text-sm">
                      <Badge variant={cambio.tipo === 'agrega' ? 'secondary' : 'outline'}>
                        {cambio.tipo === 'agrega' ? (
                          <UserPlus className="size-3" aria-hidden />
                        ) : (
                          <UserMinus className="size-3" aria-hidden />
                        )}
                        {cambio.tipo === 'agrega' ? 'Agrega' : 'Quita'}
                      </Badge>
                      {nombreDeDocente(cambio.docenteId)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>
            Seguir editando
          </Button>
          <Button onClick={onConfirmar} disabled={guardando || sinCambios}>
            {guardando ? 'Guardando...' : 'Confirmar y guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
