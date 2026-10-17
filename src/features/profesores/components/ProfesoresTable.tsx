import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Can } from '@/components/guards/Can'
import { FilasSkeleton } from '@/components/common'
import { Paginacion } from '@/components/common/Paginacion'
import type { EstadoCarga } from '@/hooks/useCarga'
import type { UseBuscador } from '@/hooks/useBuscador'
import { NIVEL_LABELS, type NivelCurricular } from '@/lib/nivelesCurso'
import type { Docente } from '@/services/profesoresService'
import {
  AlertTriangle,
  Edit,
  Eye,
  KeyRound,
  Plus,
  RefreshCcw,
  RotateCcw,
  SearchX,
  UserX,
} from 'lucide-react'

export function ProfesoresTable({
  estado,
  error,
  docentes,
  buscador,
  onReintentar,
  onCrear,
  onVer,
  onEditar,
  onDesactivar,
  onReactivar,
  onCuenta,
}: {
  estado: EstadoCarga
  error: string | null
  docentes: Docente[]
  buscador: UseBuscador<Docente>
  onReintentar: () => void
  onCrear: () => void
  onVer: (docente: Docente) => void
  onEditar: (docente: Docente) => void
  onDesactivar: (docente: Docente) => void
  onReactivar: (docente: Docente) => void
  onCuenta: (docente: Docente) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Listado de profesores</CardTitle>
        <CardDescription>
          {estado === 'ok' && docentes.length > 0
            ? buscador.busqueda.trim()
              ? `${buscador.total} resultado${buscador.total !== 1 ? 's' : ''} de ${docentes.length} profesor${docentes.length !== 1 ? 'es' : ''}`
              : `${docentes.length} profesor${docentes.length !== 1 ? 'es' : ''} registrado${docentes.length !== 1 ? 's' : ''}`
            : 'Listado del cuerpo docente'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {estado === 'error' && (
          <div className="grid gap-3">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error al cargar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div>
              <Button variant="outline" onClick={onReintentar}>
                <RefreshCcw className="size-4" aria-hidden />
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {estado === 'cargando' && (
          <Table aria-busy="true">
            <TableHeader>
              <TableRow>
                <TableHead>DNI</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombres</TableHead>
                <TableHead>Apellidos</TableHead>
                <TableHead>Niveles</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Títulos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            {estado === 'cargando' && <FilasSkeleton />}
          </Table>
        )}

        {estado === 'ok' && docentes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay profesores registrados.
            </p>
            <Can permission="profesores.crear">
              <Button onClick={onCrear}>
                <Plus className="size-4" aria-hidden />
                Registrar el primer profesor
              </Button>
            </Can>
          </div>
        )}

        {estado === 'ok' && docentes.length > 0 && buscador.total === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No se encontraron profesores para &quot;{buscador.busqueda}&quot;.
            </p>
            <Button variant="outline" onClick={() => buscador.setBusqueda('')}>
              Limpiar búsqueda
            </Button>
          </div>
        )}

        {estado === 'ok' && buscador.visibles.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DNI</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombres</TableHead>
                <TableHead>Apellidos</TableHead>
                <TableHead>Niveles</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Títulos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buscador.visibles.map((docente) => (
                <TableRow key={docente.id}>
                  <TableCell className="font-medium">{docente.dni}</TableCell>
                  <TableCell className="tabular-nums">{docente.codigoInstitucional}</TableCell>
                  <TableCell>{docente.nombres}</TableCell>
                  <TableCell>{docente.apellidos}</TableCell>
                  <TableCell>
                    {docente.niveles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {docente.niveles.map((n) => (
                          <Badge key={n} variant="outline">
                            {NIVEL_LABELS[n]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{docente.especialidad ?? '—'}</TableCell>
                  <TableCell>
                    {docente.titulos && docente.titulos.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {docente.titulos.map((t) => (
                          <span key={t.nivel} className="text-sm">
                            <Badge variant="outline" className="mr-1.5">
                              {NIVEL_LABELS[t.nivel as NivelCurricular] ?? t.nivel}
                            </Badge>
                            {t.titulo}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={docente.estado === 'ACTIVO' ? 'success' : 'outline'}>
                      {docente.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onVer(docente)}
                        aria-label={`Ver ficha de ${docente.nombres} ${docente.apellidos}`}
                      >
                        <Eye className="size-3" aria-hidden />
                        Ver
                      </Button>
                      <Can permission="usuarios.gestionar">
                        {docente.estado === 'ACTIVO' && !docente.tieneCuenta && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onCuenta(docente)}
                          >
                            <KeyRound className="size-3" aria-hidden />
                            Cuenta
                          </Button>
                        )}
                      </Can>
                      <Can permission="profesores.editar">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onEditar(docente)}
                        >
                          <Edit className="size-3" aria-hidden />
                          Editar
                        </Button>
                      </Can>
                      <Can permission="profesores.eliminar">
                        {docente.estado === 'ACTIVO' && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onDesactivar(docente)}
                          >
                            <UserX className="size-3" aria-hidden />
                            Dar de baja
                          </Button>
                        )}
                      </Can>
                      <Can permission="profesores.editar">
                        {docente.estado === 'INACTIVO' && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onReactivar(docente)}
                          >
                            <RotateCcw className="size-3" aria-hidden />
                            Volver a activar
                          </Button>
                        )}
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {estado === 'ok' && buscador.visibles.length > 0 && (
          <div className="mt-4">
            <Paginacion
              pagina={buscador.pagina}
              totalPaginas={buscador.totalPaginas}
              total={buscador.total}
              inicio={buscador.inicio}
              fin={buscador.fin}
              onCambiarPagina={buscador.setPagina}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
