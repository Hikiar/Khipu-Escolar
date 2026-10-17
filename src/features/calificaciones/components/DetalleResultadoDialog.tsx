import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { X } from 'lucide-react'
import type { ResultadoCurso, PromedioCompetencia } from '@/services/evaluacionService'
import { NivelLogroBadge } from './NivelLogroBadge'

export function DetalleResultadoDialog({
  resultado,
  onCancelar,
}: {
  resultado: ResultadoCurso | null
  onCancelar: () => void
}) {
  return (
    <Dialog open={resultado !== null} onOpenChange={onCancelar}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalle del resultado</DialogTitle>
          <DialogDescription>
            {resultado?.alumno
              ? `${resultado.alumno.apellidos} ${resultado.alumno.nombres} (${resultado.alumno.dni})`
              : resultado?.alumnoId}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Modelo</p>
              <p className="font-medium">{resultado?.modelo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Promedio general</p>
              <p className="font-medium text-xl">
                {resultado && resultado.promedio !== null ? resultado.promedio.toFixed(2) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nivel de logro</p>
              <p className="font-medium"><NivelLogroBadge nivel={resultado?.nivelLogro ?? null} /></p>
            </div>
          </div>

          {resultado?.competencias.length ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Competencias</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead className="text-right">Promedio</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead className="text-right">Trabajos calif.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.competencias.map((comp: PromedioCompetencia) => (
                    <TableRow key={comp.competenciaId}>
                      <TableCell>{comp.codigo}</TableCell>
                      <TableCell>{comp.nombre}</TableCell>
                      <TableCell className="text-right font-medium">
                        {comp.promedio !== null ? comp.promedio.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell><NivelLogroBadge nivel={comp.nivelLogro} /></TableCell>
                      <TableCell className="text-right">{comp.trabajosCalificados}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No hay datos de competencias disponibles.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar}>
            <X className="size-4 mr-2" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
