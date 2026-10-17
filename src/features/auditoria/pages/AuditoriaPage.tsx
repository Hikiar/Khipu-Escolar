import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  History,
  RefreshCcw,
  ScrollText,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilasSkeleton, Paginacion, EmptyState } from '@/components/common'
import { listarAuditoria, type RegistroAuditoria } from '@/services/auditoriaService'
import { listarUsuarios, type UsuarioConPersona } from '@/services/usuariosService'

const FILAS_POR_PAGINA = 25

type FiltroMetodo = 'TODOS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type FiltroEstado = 'TODOS' | 'EXITO' | 'CLIENTE' | 'SERVIDOR'

interface Filtros {
  usuarioId: string
  metodo: FiltroMetodo
  estado: FiltroEstado
  ruta: string
  desde: string
  hasta: string
}

const FILTROS_INICIALES: Filtros = {
  usuarioId: 'TODOS',
  metodo: 'TODOS',
  estado: 'TODOS',
  ruta: '',
  desde: '',
  hasta: '',
}

function clasificarEstado(status: number): FiltroEstado {
  if (status >= 500) return 'SERVIDOR'
  if (status >= 400) return 'CLIENTE'
  return 'EXITO'
}

function varianteMetodo(metodo: string): 'default' | 'secondary' | 'destructive' | 'info' {
  if (metodo === 'DELETE') return 'destructive'
  if (metodo === 'POST') return 'info'
  return 'secondary'
}

function varianteEstado(status: number): 'success' | 'info' | 'warning' | 'destructive' {
  if (status >= 500) return 'destructive'
  if (status >= 400) return 'warning'
  if (status >= 300) return 'info'
  return 'success'
}

function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'medium' })
}

/** Fecha local (YYYY-MM-DD) de un ISO, para comparar con `<input type="date">`. */
function fechaLocalISO(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso.slice(0, 10)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function AuditoriaPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioConPersona[]>([])
  const [error, setError] = useState<string | null>(null)

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES)
  const [pagina, setPagina] = useState(1)

  const cargar = useCallback(async () => {
    const [resAuditoria, resUsuarios] = await Promise.all([
      listarAuditoria(),
      listarUsuarios().catch(() => null),
    ])
    if (resAuditoria.ok === true) {
      setRegistros(resAuditoria.data)
      // El cruce de usuarios es auxiliar: si falla se degrada a mostrar el id.
      setUsuarios(resUsuarios?.ok === true ? resUsuarios.data : [])
      setEstado('ok')
    } else {
      setError(resAuditoria.error)
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

  function actualizarFiltro<K extends keyof Filtros>(clave: K, valor: Filtros[K]) {
    setFiltros((f) => ({ ...f, [clave]: valor }))
    setPagina(1)
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    setPagina(1)
  }

  const mapaUsuarios = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const u of usuarios) {
      const nombre = u.persona
        ? `${u.persona.nombres} ${u.persona.apellidos}`
        : u.username
      mapa.set(u.id, `${u.username} · ${nombre}`)
    }
    return mapa
  }, [usuarios])

  const filtrados = useMemo(() => {
    const rutaBuscada = filtros.ruta.trim().toLowerCase()
    return registros.filter((registro) => {
      if (filtros.usuarioId !== 'TODOS' && registro.usuarioId !== filtros.usuarioId) {
        return false
      }
      if (filtros.metodo !== 'TODOS' && registro.metodo !== filtros.metodo) {
        return false
      }
      if (filtros.estado !== 'TODOS' && clasificarEstado(registro.status) !== filtros.estado) {
        return false
      }
      if (rutaBuscada && !registro.ruta.toLowerCase().includes(rutaBuscada)) {
        return false
      }
      // Comparar en fecha LOCAL (el ISO de la BD está en UTC; en UTC-5 un
      // evento de tarde caería en el día UTC siguiente sin esta conversión).
      const dia = fechaLocalISO(registro.createdAt)
      if (filtros.desde && dia < filtros.desde) return false
      if (filtros.hasta && dia > filtros.hasta) return false
      return true
    })
  }, [registros, filtros])

  const hayFiltrosActivos =
    filtros.usuarioId !== 'TODOS' ||
    filtros.metodo !== 'TODOS' ||
    filtros.estado !== 'TODOS' ||
    filtros.ruta.trim() !== '' ||
    filtros.desde !== '' ||
    filtros.hasta !== ''

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / FILAS_POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const inicio = (paginaSegura - 1) * FILAS_POR_PAGINA
  const fin = Math.min(inicio + FILAS_POR_PAGINA, filtrados.length)
  const visibles = filtrados.slice(inicio, fin)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auditoría"
        description="Bitácora de acciones registradas en el sistema (solo dirección)."
        icon={<ScrollText className="size-5" />}
        actions={
          <Button variant="outline" onClick={reintentar} disabled={estado === 'cargando'}>
            <RefreshCcw className="size-4" aria-hidden />
            Recargar
          </Button>
        }
      />

      <Alert>
        <History className="size-4" aria-hidden />
        <AlertTitle>Alcance de la bitácora</AlertTitle>
        <AlertDescription>
          Solo se registran <strong>mutaciones</strong> (POST, PUT, PATCH y DELETE); las
          consultas (GET) no aparecen. Se muestran los <strong>200 registros más
          recientes</strong>. Esta página es de solo lectura.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Refina la bitácora por usuario, acción, estado, ruta o rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="auditoria-usuario" className="mb-1.5 block">Usuario</Label>
              <Select
                value={filtros.usuarioId}
                onValueChange={(v) => actualizarFiltro('usuarioId', v)}
              >
                <SelectTrigger id="auditoria-usuario" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {mapaUsuarios.get(u.id) ?? u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="auditoria-metodo" className="mb-1.5 block">Acción</Label>
              <Select
                value={filtros.metodo}
                onValueChange={(v) => actualizarFiltro('metodo', v as FiltroMetodo)}
              >
                <SelectTrigger id="auditoria-metodo" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="POST">POST (crear)</SelectItem>
                  <SelectItem value="PUT">PUT (reemplazar)</SelectItem>
                  <SelectItem value="PATCH">PATCH (actualizar)</SelectItem>
                  <SelectItem value="DELETE">DELETE (eliminar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="auditoria-estado" className="mb-1.5 block">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(v) => actualizarFiltro('estado', v as FiltroEstado)}
              >
                <SelectTrigger id="auditoria-estado" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="EXITO">Éxito (2xx/3xx)</SelectItem>
                  <SelectItem value="CLIENTE">Error de cliente (4xx)</SelectItem>
                  <SelectItem value="SERVIDOR">Fallo de servidor (5xx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="auditoria-ruta" className="mb-1.5 block">Ruta</Label>
              <Input
                id="auditoria-ruta"
                value={filtros.ruta}
                onChange={(e) => actualizarFiltro('ruta', e.target.value)}
                placeholder="Substring de la ruta, p. ej. /matriculas"
              />
            </div>

            <div>
              <Label htmlFor="auditoria-desde" className="mb-1.5 block">Desde</Label>
              <Input
                id="auditoria-desde"
                type="date"
                value={filtros.desde}
                onChange={(e) => actualizarFiltro('desde', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="auditoria-hasta" className="mb-1.5 block">Hasta</Label>
              <Input
                id="auditoria-hasta"
                type="date"
                value={filtros.hasta}
                onChange={(e) => actualizarFiltro('hasta', e.target.value)}
              />
            </div>
          </div>

          {hayFiltrosActivos && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={limpiarFiltros}>
              <X className="size-4" aria-hidden />
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registros</CardTitle>
          <CardDescription>
            {estado === 'ok' && filtrados.length > 0
              ? `${filtrados.length} registro${filtrados.length !== 1 ? 's' : ''} coincide${filtrados.length !== 1 ? 'n' : ''} con los filtros (de ${registros.length} en la bitácora).`
              : 'Registro cronológico de mutaciones.'}
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
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={6} />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && registros.length === 0 && (
            <EmptyState
              icon={<ScrollText className="size-10" />}
              title="Sin registros"
              description="No hay registros de auditoría todavía. Aparecerán aquí las mutaciones del sistema."
            />
          )}

          {estado === 'ok' && registros.length > 0 && filtrados.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ningún registro coincide con los filtros.
            </p>
          )}

          {estado === 'ok' && filtrados.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibles.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatearFechaHora(registro.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {registro.usuarioId === null ? (
                          <span className="text-muted-foreground">Sistema/Anónimo</span>
                        ) : (
                          mapaUsuarios.get(registro.usuarioId) ?? (
                            <span className="font-mono text-xs">{registro.usuarioId}</span>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={varianteMetodo(registro.metodo)} className="font-mono text-[10px]">
                          {registro.metodo}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="max-w-[280px] truncate font-mono text-xs"
                        title={registro.ruta}
                      >
                        {registro.ruta}
                      </TableCell>
                      <TableCell>
                        <Badge variant={varianteEstado(registro.status)}>
                          {registro.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {registro.ip ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Paginacion
                pagina={paginaSegura}
                totalPaginas={totalPaginas}
                total={filtrados.length}
                inicio={inicio}
                fin={fin}
                onCambiarPagina={setPagina}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
