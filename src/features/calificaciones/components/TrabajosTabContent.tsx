import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TabsContent } from '@/components/ui/tabs'
import { Can } from '@/components/guards/Can'
import { AlertTriangle, RefreshCcw, Trash2, Edit2, Plus } from 'lucide-react'
import type { Trabajo } from '@/services/evaluacionService'

export function TrabajosTabContent({
  estado,
  error,
  onReintentar,
  trabajos,
  traducirCompetencia,
  onNuevo,
  onEditar,
  onCalificar,
  onAnular,
}: {
  estado: EstadoCarga
  error: string | null
  onReintentar: () => void
  trabajos: Trabajo[]
  traducirCompetencia: (compId: string) => string
  onNuevo: () => void
  onEditar: (trabajo: Trabajo) => void
  onCalificar: (trabajo: Trabajo) => void
  onAnular: (trabajo: Trabajo) => void
}) {
  return (
    <TabsContent value="trabajos">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Trabajos de evaluación</CardTitle>
            <CardDescription>Trabajos registrados para esta clase y curso</CardDescription>
          </div>
          <Can permission="notas.registrar">
            <Button size="sm" onClick={onNuevo}>
              <Plus className="size-4" /> Nuevo trabajo
            </Button>
          </Can>
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
              <TableHead>Nombre</TableHead><TableHead>Competencia</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead>
            </TableRow></TableHeader><TableBody><FilasSkeleton columnas={5} /></TableBody></Table>
          )}
          {estado === 'ok' && trabajos.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay trabajos registrados para esta clase y curso.</p>
          )}
          {estado === 'ok' && trabajos.length > 0 && (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nombre</TableHead><TableHead>Competencia</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {trabajos.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nombre}</TableCell>
                    <TableCell>{traducirCompetencia(t.competenciaCursoId)}</TableCell>
                    <TableCell>{t.fecha ? new Date(t.fecha).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={t.activo ? 'success' : 'outline'}>
                        {t.activo ? 'Activo' : 'Anulado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.activo && (
                        <div className="flex gap-1">
                          <Can permission="notas.registrar">
                            <Button variant="ghost" size="icon-sm" onClick={() => onEditar(t)} aria-label={`Editar trabajo ${t.nombre}`}>
                              <Edit2 className="size-3" aria-hidden />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onCalificar(t)}>
                              Calificar
                            </Button>
                            <Button variant="destructive" size="icon-sm" onClick={() => onAnular(t)} aria-label={`Anular trabajo ${t.nombre}`}>
                              <Trash2 className="size-3" aria-hidden />
                            </Button>
                          </Can>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
