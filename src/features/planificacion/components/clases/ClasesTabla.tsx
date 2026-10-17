import { FilasSkeleton } from '@/components/common'
import {
  Card,
  CardContent,
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
import type { EstadoCarga } from '@/hooks/useCarga'
import type { Clase, Grado } from '@/services/gradosService'
import type { PeriodoAcademico, Docente } from '@/services/catalogoService'
import { Plus, Trash2, Users } from 'lucide-react'

export function ClasesTabla({
  clasesEstado,
  clasesMostradas,
  docentes,
  periodo,
  gradoSeleccionado,
  onCrear,
  onEditar,
  onEliminar,
}: {
  clasesEstado: EstadoCarga
  clasesMostradas: Clase[]
  docentes: Docente[]
  periodo: PeriodoAcademico | null
  gradoSeleccionado: Grado | null
  onCrear: () => void
  onEditar: (clase: Clase) => void
  onEliminar: (clase: Clase) => void
}) {
  return (
    <>
      {clasesEstado === 'cargando' && (
        <Card>
          <CardContent className="p-4">
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Grado</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Año lectivo</TableHead>
                  <TableHead>Tutor de aula</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cupos disponibles</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={7} />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {clasesEstado === 'ok' && clasesMostradas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="size-12 mx-auto text-muted-foreground/50" aria-hidden />
            <h4 className="mt-4 text-lg font-medium">No hay clases registradas</h4>
            <p className="text-sm text-muted-foreground">
              {gradoSeleccionado
                ? 'Cree la primera clase para este grado'
                : 'Selecciona un grado en la pestaña "Grados y Secciones"'}
            </p>
            <Can permission="grados.crear">
              <Button onClick={onCrear} className="mt-4" disabled={!periodo || !gradoSeleccionado}>
                <Plus className="size-4 mr-2" aria-hidden />
                Crear clase
              </Button>
            </Can>
          </CardContent>
        </Card>
      )}

      {clasesEstado === 'ok' && clasesMostradas.length > 0 && (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grado</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Año lectivo</TableHead>
                  <TableHead>Tutor de aula</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cupos disponibles</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clasesMostradas.map((clase) => (
                  <TableRow key={clase.id}>
                    <TableCell className="font-medium">{clase.gradoNombre}</TableCell>
                    <TableCell>{clase.seccionNombre}</TableCell>
                    <TableCell>{clase.periodoCodigo}</TableCell>
                    <TableCell>
                      {docentes.find((d) => d.id === clase.tutorDocenteId)
                        ? `${docentes.find((d) => d.id === clase.tutorDocenteId)!.nombres} ${docentes.find((d) => d.id === clase.tutorDocenteId)!.apellidos}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={clase.estado === 'ACTIVO' ? 'success' : 'outline'}>
                        {clase.estado === 'ACTIVO' ? 'Activo' : clase.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{clase.vacantes}</TableCell>
                    <TableCell>
                      <Can permission="grados.editar">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onEditar(clase)}
                        >
                          Editar
                        </Button>
                      </Can>
                      <Can permission="grados.eliminar">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onEliminar(clase)}
                        >
                          <Trash2 className="size-3" aria-hidden />
                          Eliminar
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
