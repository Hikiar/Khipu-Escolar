import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Edit2,
  Loader2,
  Plus,
  Receipt,
  RefreshCcw,
  Trash2,
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Can } from '@/components/guards/Can'
import { EmptyState, ErrorState, FilasSkeleton } from '@/components/common'
import { notificarExito } from '@/lib/feedback'
import {
  crearConcepto,
  actualizarConcepto,
  eliminarConcepto,
  listarConceptos,
  type ConceptoPago,
  type TipoConcepto,
} from '@/services/pagosService'
import {
  listarPeriodos,
  obtenerPeriodoActivo,
  type PeriodoAcademico,
} from '@/services/periodosService'
import { etiquetaConcepto } from '../utils'

const TIPOS: readonly TipoConcepto[] = ['MATRICULA', 'PENSION', 'OTRO']

function varianteTipo(t: TipoConcepto): 'default' | 'secondary' | 'outline' {
  if (t === 'MATRICULA') return 'default'
  if (t === 'PENSION') return 'secondary'
  return 'outline'
}

function formatearMonto(monto: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

function formatearFecha(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-PE', { dateStyle: 'medium' })
}

interface EstadoDialogo {
  abierto: boolean
  modo: 'crear' | 'editar'
  concepto: ConceptoPago | null
}

export function ConceptosPagoPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [conceptos, setConceptos] = useState<ConceptoPago[]>([])
  const [error, setError] = useState<string | null>(null)

  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([])
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('')
  const [cargandoPeriodos, setCargandoPeriodos] = useState(true)

  const [dialogo, setDialogo] = useState<EstadoDialogo>({
    abierto: false,
    modo: 'crear',
    concepto: null,
  })
  const [formCodigo, setFormCodigo] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formTipo, setFormTipo] = useState<TipoConcepto>('PENSION')
  const [formMonto, setFormMonto] = useState('')
  const [formVencimiento, setFormVencimiento] = useState('')
  const [formObligatorio, setFormObligatorio] = useState(true)
  const [formEnviando, setFormEnviando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [conceptoPorEliminar, setConceptoPorEliminar] = useState<ConceptoPago | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  // Guarda de secuencia (m1): descarta respuestas tardías al cambiar de periodo.
  const peticionConsecuencia = useRef(0)

  // Carga inicial de periodos + activo.
  const cargarPeriodos = useCallback(async () => {
    setCargandoPeriodos(true)
    const [resPeriodos, resActivo] = await Promise.all([
      listarPeriodos().catch(() => null),
      obtenerPeriodoActivo().catch(() => null),
    ])
    const lista = resPeriodos?.ok === true ? resPeriodos.data : []
    const activo = resActivo?.ok === true ? resActivo.data : null
    // Degradación: si listarPeriodos falla (403), usar solo el activo.
    setPeriodos(lista.length > 0 ? lista : activo ? [activo] : [])
    setPeriodoSeleccionado((prev) => prev || activo?.id || lista[0]?.id || '')
    setCargandoPeriodos(false)
  }, [])

  const cargarConceptos = useCallback(async (periodoId: string) => {
    if (!periodoId) return
    const peticion = ++peticionConsecuencia.current
    setEstado('cargando')
    setError(null)
    try {
      const res = await listarConceptos(periodoId)
      if (peticion !== peticionConsecuencia.current) return // respuesta tardía (m1)
      if (res.ok === false) {
        setError(res.error)
        setEstado('error')
      } else {
        setConceptos(res.data)
        setEstado('ok')
      }
    } catch {
      if (peticion !== peticionConsecuencia.current) return
      setError('No se pudieron cargar los conceptos. Verifica tu conexión.')
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    void cargarPeriodos()
  }, [cargarPeriodos])

  useEffect(() => {
    if (periodoSeleccionado) void cargarConceptos(periodoSeleccionado)
  }, [periodoSeleccionado, cargarConceptos])

  const periodoActual = periodos.find((p) => p.id === periodoSeleccionado) ?? null
  const periodoCerrado = periodoActual?.estado === 'CERRADO'

  function reintentar() {
    if (periodoSeleccionado) void cargarConceptos(periodoSeleccionado)
  }

  function abrirDialogoCrear() {
    setFormCodigo('')
    setFormDescripcion('')
    setFormTipo('PENSION')
    setFormMonto('')
    setFormVencimiento('')
    setFormObligatorio(true)
    setFormError(null)
    setDialogo({ abierto: true, modo: 'crear', concepto: null })
  }

  function abrirDialogoEditar(concepto: ConceptoPago) {
    setFormCodigo(concepto.codigo)
    setFormDescripcion(concepto.descripcion)
    setFormTipo(concepto.tipo)
    setFormMonto(String(concepto.montoBase))
    setFormVencimiento(concepto.fechaVencimiento ?? '')
    setFormObligatorio(concepto.obligatorio)
    setFormError(null)
    setDialogo({ abierto: true, modo: 'editar', concepto })
  }

  function cerrarDialogo() {
    setDialogo({ abierto: false, modo: 'crear', concepto: null })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formCodigo.trim() || !formDescripcion.trim()) return

    const monto = Number(formMonto)
    if (!Number.isFinite(monto) || monto < 0) {
      setFormError('El monto base no puede ser negativo.')
      return
    }

    setFormEnviando(true)
    setFormError(null)

    let res
    try {
      if (dialogo.modo === 'crear') {
        res = await crearConcepto({
          periodoId: periodoSeleccionado,
          codigo: formCodigo.trim().toUpperCase(),
          descripcion: formDescripcion.trim(),
          tipo: formTipo,
          montoBase: monto,
          fechaVencimiento: formVencimiento || undefined,
          obligatorio: formObligatorio,
        })
      } else {
        if (!dialogo.concepto) {
          setFormEnviando(false)
          return
        }
        res = await actualizarConcepto(dialogo.concepto.id, {
          codigo: formCodigo.trim().toUpperCase(),
          descripcion: formDescripcion.trim(),
          tipo: formTipo,
          montoBase: monto,
          fechaVencimiento: formVencimiento || null,
          obligatorio: formObligatorio,
        })
      }
    } catch {
      setFormEnviando(false)
      setFormError('No se pudo guardar el concepto. Verifica tu conexión e inténtalo de nuevo.')
      return
    }

    setFormEnviando(false)

    if (res.ok) {
      notificarExito(
        dialogo.modo === 'crear' ? 'Concepto creado' : 'Concepto actualizado',
        `${formCodigo.trim().toUpperCase()} — ${formDescripcion.trim()}`,
      )
      cerrarDialogo()
      void cargarConceptos(periodoSeleccionado)
    } else {
      setFormError(res.error)
    }
  }

  async function confirmarEliminar() {
    if (!conceptoPorEliminar) return
    setEliminando(true)
    setErrorEliminar(null)

    let res
    try {
      res = await eliminarConcepto(conceptoPorEliminar.id)
    } catch {
      setEliminando(false)
      setErrorEliminar('No se pudo eliminar el concepto. Verifica tu conexión.')
      return
    }
    setEliminando(false)
    if (res.ok === true) {
      notificarExito('Concepto eliminado', `${conceptoPorEliminar.codigo} — ${conceptoPorEliminar.descripcion}`)
      setConceptoPorEliminar(null)
      void cargarConceptos(periodoSeleccionado)
    } else {
      setErrorEliminar(res.error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conceptos de pago"
        description="Catálogo de conceptos del cronograma por año lectivo."
        icon={<Receipt className="size-5" />}
        actions={
          <Can permission="conceptosPago.crear">
            <Button onClick={abrirDialogoCrear} disabled={periodoCerrado || !periodoSeleccionado}>
              <Plus className="size-4" aria-hidden />
              Nuevo concepto
            </Button>
          </Can>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Año lectivo</CardTitle>
          <CardDescription>
            El cronograma de conceptos es por periodo. Cambia el año lectivo para ver o configurar otro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full max-w-xs">
              <Label htmlFor="conceptos-periodo" className="mb-1.5 block">
                Año lectivo
              </Label>
              <Select
                value={periodoSeleccionado}
                onValueChange={setPeriodoSeleccionado}
              >
                <SelectTrigger id="conceptos-periodo" className="w-full">
                  <SelectValue placeholder="Selecciona un año lectivo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.estado})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {periodoActual && (
              <Badge
                variant={
                  periodoActual.estado === 'ACTIVO'
                    ? 'success'
                    : periodoActual.estado === 'CERRADO'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {periodoActual.estado}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void cargarConceptos(periodoSeleccionado)}
              disabled={estado === 'cargando' || !periodoSeleccionado}
              aria-label="Recargar conceptos"
            >
              <RefreshCcw className="size-4" aria-hidden />
              Recargar
            </Button>
          </div>

          {periodoCerrado && (
            <Alert className="mt-4">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Año lectivo cerrado</AlertTitle>
              <AlertDescription>
                El cronograma de este año lectivo está en solo lectura. Para
                modificarlo, activa un año lectivo vigente en Años lectivos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conceptos</CardTitle>
          <CardDescription>
            {estado === 'ok' && conceptos.length > 0
              ? `${conceptos.length} concepto${conceptos.length !== 1 ? 's' : ''} en el cronograma.`
              : 'Cronograma de cobros del año lectivo seleccionado.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cargandoPeriodos && periodos.length === 0 && (
            <EmptyState
              icon={<CalendarDays className="size-10" />}
              title="Sin años lectivos"
              description="No hay años lectivos disponibles. Crea o activa un año lectivo para gestionar sus conceptos de pago."
            />
          )}

          {periodoSeleccionado && estado === 'error' && (
            <ErrorState message={error ?? 'No se pudieron cargar los conceptos.'} onRetry={reintentar} />
          )}

          {periodoSeleccionado && estado === 'cargando' && (
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto base</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Obligatorio</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={7} />
              </TableBody>
            </Table>
          )}

          {periodoSeleccionado && estado === 'ok' && conceptos.length === 0 && (
            <EmptyState
              icon={<Receipt className="size-10" />}
              title="Sin conceptos"
              description="No hay conceptos de pago para este año lectivo. Crea el primero con «Nuevo concepto»."
            />
          )}

          {periodoSeleccionado && estado === 'ok' && conceptos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto base</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Obligatorio</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conceptos.map((concepto) => (
                  <TableRow key={concepto.id}>
                    <TableCell className="font-mono font-medium">{concepto.codigo}</TableCell>
                    <TableCell className="max-w-xs text-sm">{concepto.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant={varianteTipo(concepto.tipo)} size="sm">
                        {etiquetaConcepto(concepto.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatearMonto(concepto.montoBase)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatearFecha(concepto.fechaVencimiento)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={concepto.obligatorio ? 'secondary' : 'outline'} size="sm">
                        {concepto.obligatorio ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Can permission="conceptosPago.editar">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => abrirDialogoEditar(concepto)}
                            disabled={periodoCerrado}
                            aria-label={`Editar ${concepto.codigo}`}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                        </Can>
                        <Can permission="conceptosPago.eliminar">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setErrorEliminar(null)
                              setConceptoPorEliminar(concepto)
                            }}
                            disabled={periodoCerrado}
                            aria-label={`Eliminar ${concepto.codigo}`}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogo.abierto} onOpenChange={cerrarDialogo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogo.modo === 'crear' ? 'Nuevo concepto de pago' : 'Editar concepto'}
            </DialogTitle>
            <DialogDescription>
              {dialogo.modo === 'crear'
                ? `Añade un concepto al cronograma de ${periodoActual?.nombre ?? 'este año lectivo'}.`
                : `Editando: ${dialogo.concepto?.codigo} — ${dialogo.concepto?.descripcion}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-3 py-2">
              {formError && (
                <Alert variant="destructive" id="concepto-error">
                  <AlertTriangle className="size-4" aria-hidden />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concepto-codigo">
                  Código <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concepto-codigo"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: MATRICULA, PENSION-03"
                  maxLength={50}
                  required
                  disabled={formEnviando}
                  aria-invalid={formError !== null && !formCodigo.trim() ? true : undefined}
                  aria-describedby={
                    formError !== null && !formCodigo.trim()
                      ? 'concepto-error concepto-codigo-ayuda'
                      : 'concepto-codigo-ayuda'
                  }
                />
                <p className="text-xs text-muted-foreground" id="concepto-codigo-ayuda">
                  Identificador único dentro del año lectivo.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concepto-descripcion">
                  Descripción <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concepto-descripcion"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Ej: Mensualidad de marzo"
                  maxLength={200}
                  required
                  disabled={formEnviando}
                  aria-invalid={formError !== null && !formDescripcion.trim() ? true : undefined}
                  aria-describedby={
                    formError !== null && !formDescripcion.trim()
                      ? 'concepto-error'
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concepto-tipo">Tipo</Label>
                <Select
                  value={formTipo}
                  onValueChange={(v) => setFormTipo(v as TipoConcepto)}
                >
                  <SelectTrigger id="concepto-tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {etiquetaConcepto(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concepto-monto">
                  Monto base (S/) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concepto-monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={formEnviando}
                  aria-invalid={formError !== null && (!formMonto || Number(formMonto) < 0) ? true : undefined}
                  aria-describedby={
                    formError !== null && (!formMonto || Number(formMonto) < 0)
                      ? 'concepto-error'
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concepto-vencimiento">Fecha de vencimiento</Label>
                <Input
                  id="concepto-vencimiento"
                  type="date"
                  value={formVencimiento}
                  onChange={(e) => setFormVencimiento(e.target.value)}
                  disabled={formEnviando}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Déjala vacía si no aplica.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="concepto-obligatorio"
                  checked={formObligatorio}
                  onCheckedChange={(v) => setFormObligatorio(v === true)}
                  disabled={formEnviando}
                />
                <Label htmlFor="concepto-obligatorio" className="cursor-pointer">
                  Concepto obligatorio
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={cerrarDialogo}
                disabled={formEnviando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formEnviando || !formCodigo.trim() || !formDescripcion.trim()}
              >
                {formEnviando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : dialogo.modo === 'crear' ? (
                  'Crear'
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={conceptoPorEliminar !== null}
        onOpenChange={(open) => {
          if (!open) setConceptoPorEliminar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar concepto</DialogTitle>
            <DialogDescription>
              ¿Eliminar el concepto <strong>{conceptoPorEliminar?.codigo}</strong> (
              {conceptoPorEliminar?.descripcion})? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {errorEliminar && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>No se pudo eliminar</AlertTitle>
              <AlertDescription>{errorEliminar}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConceptoPorEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarEliminar}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar concepto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
