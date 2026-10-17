import type { EstadoCarga } from '@/hooks/useCarga'
import { ErrorState, FilasSkeleton } from '@/components/common'
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
import { notificarExito, notificarError } from '@/lib/feedback'
import { invalidarPeriodoActivo } from '@/hooks/usePeriodoActivo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { Can } from '@/components/guards/Can'
import { CalendarClock, Plus, RefreshCcw, Power, Lock } from 'lucide-react'
import type { ResultadoServicio } from '@/types/operations'
import {
  listarPeriodos,
  crearPeriodo,
  activarPeriodo,
  cerrarPeriodo,
  type PeriodoAcademico,
  type CrearPeriodoInput,
  type EstadoPeriodo,
} from '@/services/periodosService'


function extraerError<T>(res: ResultadoServicio<T>): string {
  if ('error' in res) return res.error
  return ''
}

const ESTADO_VARIANTE: Record<EstadoPeriodo, 'default' | 'secondary' | 'destructive'> = {
  ACTIVO: 'default',
  CERRADO: 'destructive',
  PLANIFICADO: 'secondary',
}

const ESTADO_LABEL: Record<EstadoPeriodo, string> = {
  ACTIVO: 'Activo',
  CERRADO: 'Cerrado',
  PLANIFICADO: 'Planificado',
}


type AccionConfirmada = { accion: 'activar' | 'cerrar'; periodo: PeriodoAcademico } | null

export function PeriodosPage() {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([])
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>('cargando')
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [confirmacion, setConfirmacion] = useState<AccionConfirmada>(null)
  const [confirmando, setConfirmando] = useState(false)

  const cargar = useCallback(async () => {
    setEstadoCarga('cargando')
    setErrorCarga(null)
    const res = await listarPeriodos()
    if (res.ok) {
      setPeriodos(res.data)
      setEstadoCarga('ok')
    } else {
      setErrorCarga(extraerError(res))
      setEstadoCarga('error')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function resetFormCrear() {
    setCodigo('')
    setNombre('')
    setFechaInicio('')
    setFechaFin('')
  }

  async function handleCrearPeriodo() {
    setEnviando(true)
    const input: CrearPeriodoInput = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    }
    const res = await crearPeriodo(input)
    setEnviando(false)
    if (res.ok) {
      notificarExito('Año lectivo creado')
      setDialogCrearAbierto(false)
      resetFormCrear()
      void cargar()
    } else {
      notificarError(extraerError(res))
    }
  }

  async function handleConfirmarAccion() {
    if (!confirmacion) return
    setConfirmando(true)
    const res =
      confirmacion.accion === 'activar'
        ? await activarPeriodo(confirmacion.periodo.id)
        : await cerrarPeriodo(confirmacion.periodo.id)
    setConfirmando(false)
    if (res.ok) {
      notificarExito(confirmacion.accion === 'activar' ? 'Año lectivo activado' : 'Año lectivo cerrado')
      invalidarPeriodoActivo()
      setConfirmacion(null)
      void cargar()
    } else {
      notificarError(extraerError(res))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Años lectivos"
        description="Un solo año lectivo activo a la vez; al cerrarlo, sus matrículas, asistencia, calificaciones y pagos quedan congelados."
        icon={<CalendarClock className="size-5" aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void cargar()}
              aria-label="Recargar años lectivos"
            >
              <RefreshCcw className="size-4" aria-hidden="true" />
            </Button>
            <Can permission="periodos.crear">
              <Button onClick={() => setDialogCrearAbierto(true)}>
                <Plus className="size-4" aria-hidden="true" />
Nuevo año lectivo
              </Button>
            </Can>
          </div>
        }
      />

      {estadoCarga === 'error' && (
        <ErrorState
          message={errorCarga ?? 'No se pudieron cargar los años lectivos.'}
          onRetry={() => void cargar()}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Años lectivos</CardTitle>
          <CardDescription>
            Historial de años lectivos. Solo el año marcado como Activo admite escrituras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estadoCarga === 'cargando' && <FilasSkeleton />}
              {estadoCarga === 'ok' && periodos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aún no hay años lectivos registrados.
                  </TableCell>
                </TableRow>
              )}
              {estadoCarga === 'ok' &&
                periodos.map((periodo) => (
                  <TableRow key={periodo.id}>
                    <TableCell className="font-medium">{periodo.codigo}</TableCell>
                    <TableCell>{periodo.nombre}</TableCell>
                    <TableCell>{periodo.fechaInicio ?? '—'}</TableCell>
                    <TableCell>{periodo.fechaFin ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_VARIANTE[periodo.estado] ?? 'secondary'}>
                        {ESTADO_LABEL[periodo.estado] ?? periodo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {periodo.estado === 'PLANIFICADO' && (
                          <Can permission="periodos.activar">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmacion({ accion: 'activar', periodo })}
                            >
                              <Power className="size-4" aria-hidden="true" />
                              Activar
                            </Button>
                          </Can>
                        )}
                        {(periodo.estado === 'PLANIFICADO' || periodo.estado === 'ACTIVO') && (
                          <Can permission="periodos.cerrar">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmacion({ accion: 'cerrar', periodo })}
                            >
                              <Lock className="size-4" aria-hidden="true" />
                              Cerrar
                            </Button>
                          </Can>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: crear periodo */}
      <Dialog open={dialogCrearAbierto} onOpenChange={setDialogCrearAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo año lectivo</DialogTitle>
            <DialogDescription>
              El año lectivo se crea en estado planificado; actívalo cuando quieras que sea el vigente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="periodo-codigo">Código</Label>
              <Input
                id="periodo-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="2027"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodo-nombre">Nombre</Label>
              <Input
                id="periodo-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Año Académico 2027"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodo-inicio">Fecha de inicio</Label>
              <Input
                id="periodo-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodo-fin">Fecha de fin</Label>
              <Input
                id="periodo-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCrearAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCrearPeriodo()} disabled={enviando || !codigo.trim() || !nombre.trim()}>
              {enviando ? 'Creando…' : 'Crear año lectivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar activar/cerrar */}
      <Dialog open={confirmacion !== null} onOpenChange={(abierto) => !abierto && setConfirmacion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmacion?.accion === 'activar' ? 'Activar año lectivo' : 'Cerrar año lectivo'}
            </DialogTitle>
            <DialogDescription>
              {confirmacion?.accion === 'activar' ? (
                <>
                  Se activará <strong>{confirmacion?.periodo.codigo}</strong> y el año lectivo activo actual
                  quedará cerrado automáticamente (N2: un solo año lectivo activo).
                </>
              ) : (
                <>
                  Se cerrará <strong>{confirmacion?.periodo.codigo}</strong>. A partir de ese momento sus
                  matrículas, asistencia, calificaciones y pagos pasarán a solo lectura (N10).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmacion(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirmarAccion()} disabled={confirmando}>
              {confirmando ? 'Procesando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}