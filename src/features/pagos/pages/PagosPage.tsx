import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { Can } from '@/components/guards/Can'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  listarAlumnos,
  listarPeriodoActivo,
  type Alumno,
  type PeriodoAcademico,
} from '@/services/catalogoService'
import {
  listarConceptos,
  listarPagosDeAlumno,
  registrarPago,
  anularPago,
  METODOS_PAGO,
  type ConceptoPago,
  type PagoConEntidad,
  type MetodoPago,
} from '@/services/pagosService'
import {
  Banknote,
  RefreshCcw,
  AlertTriangle,
  Plus,
  Ban,
  Settings2,
} from 'lucide-react'
import { etiquetaConcepto, etiquetaMetodo } from '../utils'


const MONEDA = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function hoyYYYYMMDD(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function PagosPage() {
  const { usuario } = useAuth()

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnoIdSeleccionado, setAlumnoIdSeleccionado] = useState<string>('')
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoAcademico | null>(
    null,
  )

  const [conceptos, setConceptos] = useState<ConceptoPago[]>([])
  const [historial, setHistorial] = useState<PagoConEntidad[]>([])
  const [estadoConceptos, setEstadoConceptos] = useState<EstadoCarga>(
    'cargando',
  )
  const [estadoHistorial, setEstadoHistorial] = useState<EstadoCarga>(
    'cargando',
  )
  const [errorConceptos, setErrorConceptos] = useState<string | null>(null)
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null)

  const [dialogoRegistro, setDialogoRegistro] = useState(false)
  const [formConceptoId, setFormConceptoId] = useState('')
  const [formMonto, setFormMonto] = useState('')
  const [formMetodo, setFormMetodo] = useState<MetodoPago>('EFECTIVO')
  const [formFecha, setFormFecha] = useState(hoyYYYYMMDD)
  const [formReferencia, setFormReferencia] = useState('')
  const [formObservaciones, setFormObservaciones] = useState('')
  const [formEnviando, setFormEnviando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [dialogoAnulacion, setDialogoAnulacion] =
    useState<PagoConEntidad | null>(null)
  const [anulando, setAnulando] = useState(false)
  const [anulacionError, setAnulacionError] = useState<string | null>(null)

  const cargarAlumnos = useCallback(async () => {
    const res = await listarAlumnos()
    if (res.ok) {
      const activos = res.data.filter((a) => a.estado === 'ACTIVO')
      setAlumnos(activos)
    }
  }, [])

  const cargarPeriodo = useCallback(async () => {
    const res = await listarPeriodoActivo()
    if (res.ok) setPeriodoActivo(res.data)
  }, [])

  useEffect(() => {
    void cargarAlumnos()
    void cargarPeriodo()
  }, [cargarAlumnos, cargarPeriodo])

  const cargarConceptos = useCallback(
    async (periodoId: string) => {
      setEstadoConceptos('cargando')
      setErrorConceptos(null)
      const res = await listarConceptos(periodoId)
      if (res.ok === false) {
        setErrorConceptos(res.error)
        setEstadoConceptos('error')
      } else {
        setConceptos(res.data)
        setEstadoConceptos('ok')
      }
    },
    [],
  )

  const cargarHistorial = useCallback(async (alumnoId: string) => {
    setEstadoHistorial('cargando')
    setErrorHistorial(null)
    const res = await listarPagosDeAlumno(alumnoId)
    if (res.ok === false) {
      setErrorHistorial(res.error)
      setEstadoHistorial('error')
    } else {
      setHistorial(res.data)
      setEstadoHistorial('ok')
    }
  }, [])

  useEffect(() => {
    if (!alumnoIdSeleccionado || !periodoActivo) return
    void cargarConceptos(periodoActivo.id)
    void cargarHistorial(alumnoIdSeleccionado)
  }, [alumnoIdSeleccionado, periodoActivo, cargarConceptos, cargarHistorial])

  function reintentar() {
    if (!alumnoIdSeleccionado || !periodoActivo) return
    void cargarConceptos(periodoActivo.id)
    void cargarHistorial(alumnoIdSeleccionado)
  }

  const pagosRegistrados = useMemo(() => {
    const mapa = new Map<string, boolean>()
    for (const p of historial) {
      if (p.estado === 'REGISTRADO') mapa.set(p.conceptoId, true)
    }
    return mapa
  }, [historial])

  function abrirDialogoRegistro() {
    setFormConceptoId('')
    setFormMonto('')
    setFormMetodo('EFECTIVO')
    setFormFecha(hoyYYYYMMDD())
    setFormReferencia('')
    setFormObservaciones('')
    setFormError(null)
    setDialogoRegistro(true)
  }

  function cambiarConcepto(conceptoId: string) {
    setFormConceptoId(conceptoId)
    const c = conceptos.find((x) => x.id === conceptoId)
    if (c) setFormMonto(String(c.montoBase))
  }

  async function enviarRegistro() {
    if (!alumnoIdSeleccionado || !formConceptoId || !usuario) return
    setFormEnviando(true)
    setFormError(null)

    const res = await registrarPago({
      alumnoId: alumnoIdSeleccionado,
      conceptoId: formConceptoId,
      monto: Number(formMonto),
      metodoPago: formMetodo,
      fecha: formFecha,
      referencia: formReferencia || undefined,
      observaciones: formObservaciones || undefined,
    })

    setFormEnviando(false)

    if (res.ok === false) {
      setFormError(res.error)
      return
    }
    setDialogoRegistro(false)
    if (periodoActivo) void cargarConceptos(periodoActivo.id)
    void cargarHistorial(alumnoIdSeleccionado)
  }

  async function ejecutarAnulacion() {
    if (!dialogoAnulacion) return
    setAnulando(true)
    setAnulacionError(null)

    const res = await anularPago(dialogoAnulacion.id)
    setAnulando(false)

    if (res.ok === false) {
      setAnulacionError(res.error)
      return
    }
    setDialogoAnulacion(null)
    if (periodoActivo) void cargarConceptos(periodoActivo.id)
    void cargarHistorial(alumnoIdSeleccionado)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pagos"
        description="Pagos y cuotas escolares"
        icon={<Banknote />}
        actions={
          <Can permission="pagos.registrar">
            <Button
              onClick={abrirDialogoRegistro}
              disabled={!alumnoIdSeleccionado || !periodoActivo}
            >
              <Plus className="size-4" aria-hidden />
              Registrar pago
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-2 sm:w-96">
        <Label htmlFor="filtro-alumno">Alumno</Label>
        <Select
          value={alumnoIdSeleccionado}
          onValueChange={(v) => setAlumnoIdSeleccionado(v as string)}
        >
          <SelectTrigger id="filtro-alumno" className="w-full">
            <SelectValue placeholder="Seleccionar alumno" />
          </SelectTrigger>
          <SelectContent>
            {alumnos.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.nombres} {a.apellidos} — {a.dni}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {periodoActivo && (
        <Alert>
          <AlertTitle>Año lectivo activo</AlertTitle>
          <AlertDescription>
            {periodoActivo.nombre} ({periodoActivo.codigo})
          </AlertDescription>
        </Alert>
      )}

      {!periodoActivo && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>Sin año lectivo activo</AlertTitle>
          <AlertDescription>
            No hay año lectivo activo. No se pueden registrar pagos.
          </AlertDescription>
        </Alert>
      )}

      {!alumnoIdSeleccionado && (
        <Alert>
          <AlertTitle>Selecciona un alumno</AlertTitle>
          <AlertDescription>
            Elige un alumno del selector para ver conceptos y pagos.
          </AlertDescription>
        </Alert>
      )}

      {alumnoIdSeleccionado && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Conceptos de pago
                  </CardTitle>
                  <CardDescription>
                    {estadoConceptos === 'ok'
                      ? `${conceptos.length} concepto${conceptos.length !== 1 ? 's' : ''}`
                      : 'Conceptos del año lectivo'}
                  </CardDescription>
                </div>
                <Can permission="conceptosPago.ver">
                  <Button variant="outline" size="sm" render={<Link to="/conceptos-pago" />}>
                    <Settings2 className="size-4" aria-hidden />
                    Gestionar conceptos
                  </Button>
                </Can>
              </div>
            </CardHeader>
            <CardContent>
              {estadoConceptos === 'error' && (
                <div className="grid gap-3">
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" aria-hidden />
                    <AlertTitle>Error al cargar</AlertTitle>
                    <AlertDescription>{errorConceptos}</AlertDescription>
                  </Alert>
                  <div>
                    <Button variant="outline" onClick={reintentar}>
                      <RefreshCcw className="size-4" aria-hidden />
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}

              {estadoConceptos === 'cargando' && (
                <Table aria-busy="true">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto base</TableHead>
                      <TableHead>Pagado</TableHead>
                      <TableHead>Vencimiento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <FilasSkeleton columnas={5} />
                  </TableBody>
                </Table>
              )}

              {estadoConceptos === 'ok' && conceptos.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay conceptos de pago para este periodo.
                </p>
              )}

              {estadoConceptos === 'ok' && conceptos.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto base</TableHead>
                      <TableHead>Pagado</TableHead>
                      <TableHead>Vencimiento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conceptos.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{c.descripcion}</span>
                            <span className="text-xs text-muted-foreground">
                              {c.codigo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {etiquetaConcepto(c.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>{MONEDA.format(c.montoBase)}</TableCell>
                        <TableCell>
                          {pagosRegistrados.has(c.id) ? (
                            <Badge variant="success">Pagado</Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              &mdash;
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.fechaVencimiento
                            ? formatearFecha(c.fechaVencimiento)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Historial de pagos
              </CardTitle>
              <CardDescription>
                {estadoHistorial === 'ok'
                  ? `${historial.length} pago${historial.length !== 1 ? 's' : ''} registrado${historial.length !== 1 ? 's' : ''}`
                  : 'Pagos del alumno'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {estadoHistorial === 'error' && (
                <div className="grid gap-3">
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" aria-hidden />
                    <AlertTitle>Error al cargar</AlertTitle>
                    <AlertDescription>{errorHistorial}</AlertDescription>
                  </Alert>
                  <div>
                    <Button variant="outline" onClick={reintentar}>
                      <RefreshCcw className="size-4" aria-hidden />
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}

              {estadoHistorial === 'cargando' && (
                <Table aria-busy="true">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <FilasSkeleton columnas={7} />
                  </TableBody>
                </Table>
              )}

              {estadoHistorial === 'ok' && historial.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay pagos registrados para este alumno.
                </p>
              )}

              {estadoHistorial === 'ok' && historial.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.concepto
                            ? `${p.concepto.nombre} (${p.concepto.codigo})`
                            : '—'}
                        </TableCell>
                        <TableCell>{formatearFecha(p.fecha)}</TableCell>
                        <TableCell>{MONEDA.format(p.monto)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {etiquetaMetodo(p.metodoPago)}
                          </Badge>
                        </TableCell>
                        <TableCell>{p.referencia ?? '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.estado === 'REGISTRADO'
                                ? 'success'
                                : 'outline'
                            }
                          >
                            {p.estado === 'REGISTRADO'
                              ? 'Registrado'
                              : 'Anulado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.estado === 'REGISTRADO' && (
                            <Can permission="pagos.anular">
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => {
                                  setDialogoAnulacion(p)
                                  setAnulacionError(null)
                                }}
                              >
                                <Ban className="size-3" aria-hidden />
                                Anular
                              </Button>
                            </Can>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogoRegistro} onOpenChange={setDialogoRegistro}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Seleccione el concepto, monto y método de pago.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Concepto</Label>
              <Select value={formConceptoId} onValueChange={cambiarConcepto}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar concepto" />
                </SelectTrigger>
                <SelectContent>
                  {conceptos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.descripcion} ({c.codigo}) &mdash;{' '}
                      {MONEDA.format(c.montoBase)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monto">Monto (S/.)</Label>
              <Input
                id="monto"
                type="number"
                min="0.01"
                step="0.01"
                value={formMonto}
                onChange={(e) => setFormMonto(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select
                value={formMetodo}
                onValueChange={(v) => setFormMetodo(v as MetodoPago)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {etiquetaMetodo(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="referencia">Referencia (opcional)</Label>
              <Input
                id="referencia"
                value={formReferencia}
                onChange={(e) => setFormReferencia(e.target.value)}
                placeholder="Nro. de comprobante, etc."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="obs-registro">Observaciones (opcional)</Label>
              <Input
                id="obs-registro"
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoRegistro(false)}
              disabled={formEnviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarRegistro}
              disabled={!formConceptoId || !formMonto || formEnviando}
            >
              {formEnviando ? 'Registrando...' : 'Registrar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoAnulacion !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoAnulacion(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular pago</DialogTitle>
            <DialogDescription>
              ¿Está seguro de anular este pago? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>

          {dialogoAnulacion && (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Concepto:</span>{' '}
                {dialogoAnulacion.concepto
                  ? `${dialogoAnulacion.concepto.nombre} (${dialogoAnulacion.concepto.codigo})`
                  : '—'}
              </p>
              <p>
                <span className="font-medium">Monto:</span>{' '}
                {MONEDA.format(dialogoAnulacion.monto)}
              </p>
              <p>
                <span className="font-medium">Fecha:</span>{' '}
                {formatearFecha(dialogoAnulacion.fecha)}
              </p>
            </div>
          )}

          {anulacionError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{anulacionError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoAnulacion(null)}
              disabled={anulando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={ejecutarAnulacion}
              disabled={anulando}
            >
              {anulando ? 'Procesando...' : 'Anular pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
