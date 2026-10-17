import type { EstadoCarga } from '@/hooks/useCarga'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { ClasesAgrupadas } from '@/components/common/ClasesAgrupadas'
import type { Clase, Curso } from '@/services/catalogoService'

export function ContextoAcademicoCard({
  estadoClases,
  errorClases,
  onReintentar,
  clases,
  claseId,
  onClaseChange,
  cursos,
  cursoId,
  onCursoChange,
}: {
  estadoClases: EstadoCarga
  errorClases: string | null
  onReintentar: () => void
  clases: Clase[]
  claseId: string
  onClaseChange: (valor: string) => void
  cursos: Curso[]
  cursoId: string
  onCursoChange: (valor: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contexto académico</CardTitle>
        <CardDescription>Seleccione una clase y un curso para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        {estadoClases === 'error' && (
          <div className="grid gap-3">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error al cargar clases</AlertTitle>
              <AlertDescription>{errorClases}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={onReintentar}>
              <RefreshCcw className="size-4" /> Reintentar
            </Button>
          </div>
        )}
        {estadoClases === 'cargando' && (
          <div className="flex gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-48" />
          </div>
        )}
        {estadoClases === 'ok' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calif-filtro-clase">Clase</Label>
              <Select value={claseId} onValueChange={(v: string) => onClaseChange(v)}>
                <SelectTrigger id="calif-filtro-clase" className="w-64">
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  <ClasesAgrupadas clases={clases} />
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calif-filtro-asignatura">Asignatura</Label>
              <Select value={cursoId} onValueChange={(v: string) => onCursoChange(v)} disabled={!claseId}>
                <SelectTrigger id="calif-filtro-asignatura" className="w-64">
                  <SelectValue placeholder={claseId ? 'Seleccionar asignatura' : 'Primero seleccione una clase'} />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map(cr => (
                    <SelectItem key={cr.id} value={cr.id}>
                      {cr.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
