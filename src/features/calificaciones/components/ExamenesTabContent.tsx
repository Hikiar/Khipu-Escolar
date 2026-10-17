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
import { AlertTriangle, RefreshCcw, Edit2, Plus } from 'lucide-react'
import type { Examen } from '@/services/evaluacionService'

export function ExamenesTabContent({
  estado,
  error,
  onReintentar,
  examenes,
  onNuevo,
  onEditar,
  onCalificar,
}: {
  estado: EstadoCarga
  error: string | null
  onReintentar: () => void
  examenes: Examen[]
  onNuevo: () => void
  onEditar: (examen: Examen) => void
  onCalificar: (examen: Examen) => void
}) {
  return (
    <TabsContent value="examenes">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Exámenes</CardTitle>
            <CardDescription>Exámenes registrados para esta clase y curso</CardDescription>
          </div>
          <Can permission="notas.registrar">
            <Button size="sm" onClick={onNuevo}>
              <Plus className="size-4" /> Nuevo examen
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
              <TableHead>Nombre</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead>
            </TableRow></TableHeader><TableBody><FilasSkeleton columnas={4} /></TableBody></Table>
          )}
          {estado === 'ok' && examenes.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay exámenes registrados para esta clase y curso.</p>
          )}
          {estado === 'ok' && examenes.length > 0 && (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nombre</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead className="w-32">Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {examenes.map(ex => (
                  <TableRow key={ex.id}>
                    <TableCell className="font-medium">{ex.nombre}</TableCell>
                    <TableCell>{ex.fecha ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={ex.estado === 'ACTIVO' ? 'success' : 'outline'}>
                        {ex.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Can permission="notas.registrar">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => onEditar(ex)} aria-label={`Editar ${ex.nombre}`}>
                            <Edit2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onCalificar(ex)}>
                            Calificar
                          </Button>
                        </div>
                      </Can>
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
