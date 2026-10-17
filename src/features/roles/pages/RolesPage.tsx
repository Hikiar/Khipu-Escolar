import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
import { useCallback, useEffect, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import type { Rol } from '@/types/rbac'
import { PERMISO_TOTAL } from '@/types/rbac'
import { listarRoles } from '@/services/rolesService'
import { AlertTriangle, RefreshCcw, ShieldCheck } from 'lucide-react'



function PermisosBadges({ rol }: { rol: Rol }) {
  if (rol.permisos.includes(PERMISO_TOTAL)) {
    return <Badge>Acceso total</Badge>
  }
  const nombres = rol.permisos.map((codigo) => {
    const [modulo, accion] = codigo.split('.')
    return `${modulo}·${accion}`
  })
  const visibles = nombres.slice(0, 3)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibles.map((nombre) => (
        <Badge key={nombre} variant="secondary" className="font-mono">
          {nombre}
        </Badge>
      ))}
      {nombres.length > visibles.length && (
        <span className="text-xs text-muted-foreground">
          +{nombres.length - visibles.length}
        </span>
      )}
    </div>
  )
}

export function RolesPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [roles, setRoles] = useState<Rol[]>([])
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const resultado = await listarRoles()
    if (resultado.ok) {
      setRoles(resultado.data)
      setEstado('ok')
    } else {
      setError('No se pudo cargar la lista de roles.')
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargar()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles y permisos"
        description="Plantillas configurables de acceso por módulo y acción."
        icon={<ShieldCheck />}
      />
      <Alert>
        <AlertTitle>Roles de plantilla</AlertTitle>
        <AlertDescription>
          Los roles se muestran en modo lectura. La edición, el renombrado, la
          activación/desactivación y la asignación de permisos por rol se
          gestionan desde el API de administración.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roles del sistema</CardTitle>
          <CardDescription>
            {estado === 'ok'
              ? `${roles.length} roles del sistema`
              : 'Listado de roles'}
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
                <Button variant="outline" onClick={reintentar}>
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
                  <TableHead>Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && roles.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay roles configurados todavía.
            </p>
          )}

          {estado === 'ok' && roles.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell>
                      <span className="font-medium">{rol.nombre}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {rol.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      {rol.descripcion}
                    </TableCell>
                    <TableCell>
                      <PermisosBadges rol={rol} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={rol.activo ? 'success' : 'outline'}>
                        {rol.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}