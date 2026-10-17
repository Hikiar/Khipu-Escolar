import type { EstadoCarga } from '@/hooks/useCarga'
import { Fragment } from 'react'
import { FilasSkeleton } from '@/components/common'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TabsContent } from '@/components/ui/tabs'
import { AlertTriangle, RefreshCcw, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import type { ResultadoCurso, PromedioCompetencia } from '@/services/evaluacionService'
import { NivelLogroBadge } from './NivelLogroBadge'

export function ResultadosTabContent({
  estado,
  error,
  onReintentar,
  resultados,
  expandedResultados,
  onToggleExpanded,
  onVerDetalle,
}: {
  estado: EstadoCarga
  error: string | null
  onReintentar: () => void
  resultados: ResultadoCurso[]
  expandedResultados: Set<string>
  onToggleExpanded: (id: string) => void
  onVerDetalle: (resultado: ResultadoCurso) => void
}) {
  return (
    <TabsContent value="resultados">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultados por alumno</CardTitle>
          <CardDescription>Promedio general y nivel de logro</CardDescription>
        </CardHeader>
        <CardContent>
          {estado === 'error' && (
            <div className="grid gap-3">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={onReintentar}>
                <RefreshCcw className="size-4" /> Reintentar
              </Button>
            </div>
          )}
          {estado === 'cargando' && (
            <Table><TableHeader><TableRow>
              <TableHead>Alumno</TableHead><TableHead>Modelo</TableHead><TableHead>Promedio</TableHead><TableHead>Nivel de logro</TableHead>
            </TableRow></TableHeader><TableBody><FilasSkeleton columnas={4} /></TableBody></Table>
          )}
          {estado === 'ok' && resultados.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay resultados disponibles.</p>
          )}
          {estado === 'ok' && resultados.length > 0 && (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Alumno</TableHead><TableHead>Modelo</TableHead><TableHead>Promedio</TableHead><TableHead>Nivel de logro</TableHead><TableHead className="w-8" /><TableHead className="w-12" />
              </TableRow></TableHeader>
              <TableBody>
                {resultados.map(r => (
                  <Fragment key={r.alumnoId}>
                    <TableRow key={r.alumnoId}>
                      <TableCell className="font-medium">
                        {r.alumno ? `${r.alumno.apellidos} ${r.alumno.nombres}` : r.alumnoId}
                      </TableCell>
                      <TableCell>{r.modelo}</TableCell>
                      <TableCell>{r.promedio !== null ? r.promedio.toFixed(2) : '—'}</TableCell>
                      <TableCell><NivelLogroBadge nivel={r.nivelLogro} /></TableCell>
                      <TableCell>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => onToggleExpanded(r.alumnoId)}
                        >
                          {expandedResultados.has(r.alumnoId) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => onVerDetalle(r)} aria-label={`Ver detalle de ${r.alumno ? `${r.alumno.apellidos} ${r.alumno.nombres}` : r.alumnoId}`}>
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedResultados.has(r.alumnoId) && r.competencias.length > 0 && (
                      <TableRow key={`${r.alumnoId}-detail`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-0">
                          <div className="px-4 py-2">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Promedios por competencia</p>
                            <Table>
                              <TableHeader><TableRow>
                                <TableHead>Código</TableHead><TableHead>Competencia</TableHead><TableHead>Promedio</TableHead><TableHead>Nivel</TableHead><TableHead>Trabajos calificados</TableHead>
                              </TableRow></TableHeader>
                              <TableBody>
                                {r.competencias.map((comp: PromedioCompetencia) => (
                                  <TableRow key={comp.competenciaId}>
                                    <TableCell>{comp.codigo}</TableCell>
                                    <TableCell>{comp.nombre}</TableCell>
                                    <TableCell>{comp.promedio !== null ? comp.promedio.toFixed(2) : '—'}</TableCell>
                                    <TableCell><NivelLogroBadge nivel={comp.nivelLogro} /></TableCell>
                                    <TableCell>{comp.trabajosCalificados}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
