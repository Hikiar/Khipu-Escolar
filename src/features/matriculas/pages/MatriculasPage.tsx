import type { EstadoCarga } from '@/hooks/useCarga'
import { ErrorState, FilasSkeleton } from '@/components/common'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { ClasesAgrupadas } from '@/components/common/ClasesAgrupadas'
import { Can } from '@/components/guards/Can'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  listarClases,
  listarClasesAbiertas,
  listarAlumnos,
  listarPeriodoActivo,
  type Clase,
  type Alumno,
} from '@/services/catalogoService'
import {
  listarMatriculas,
  crearMatricula,
  retirarMatricula,
  anularMatricula,
  obtenerMatricula,
  type Matricula,
} from '@/services/matriculasService'
import { CampoFormulario } from '@/components/common/CampoFormulario'
import { InlineError } from '@/components/common'
import { notificarExito, notificarError } from '@/lib/feedback'
import { ApiError } from '@/services/apiClient'
import { ClipboardList, Plus, Eye, UserMinus, Ban, AlertTriangle } from 'lucide-react'



function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function MatriculasPage() {
  const { usuario } = useAuth()

  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [error, setError] = useState<string | null>(null)

  const [clases, setClases] = useState<Clase[]>([])
  const [claseIdSeleccionada, setClaseIdSeleccionada] = useState<string | null>(null)

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [clasesAbiertas, setClasesAbiertas] = useState<Clase[]>([])
  const [periodoActivoId, setPeriodoActivoId] = useState<string | null>(null)

  const [formAlumnoId, setFormAlumnoId] = useState<string>('')
  const [formClaseId, setFormClaseId] = useState<string>('')
  const [formObservaciones, setFormObservaciones] = useState('')
  const [formEnviando, setFormEnviando] = useState(false)

  const [dialogoAccion, setDialogoAccion] = useState<{
    tipo: 'retirar' | 'anular'
    matricula: Matricula
  } | null>(null)
  const [accionEnviando, setAccionEnviando] = useState(false)
  const [confirmacionAnulada, setConfirmacionAnulada] = useState(false)

  // Detalle bajo demanda de matrícula (P4)
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [detalle, setDetalle] = useState<Matricula | null>(null)
  const [detalleCargando, setDetalleCargando] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)
  // Id de la matrícula cuyo detalle está en vuelo; null si el drawer está cerrado.
  const detalleAbiertoRef = useRef<string | null>(null)

  const cargarMatriculas = useCallback(async (claseId: string) => {
    const resultado = await listarMatriculas(claseId)
    if (resultado.ok === false) {
      setError(resultado.error)
      setEstado('error')
    } else {
      setMatriculas(resultado.data)
      setEstado('ok')
    }
  }, [])

  const cargarClases = useCallback(async () => {
    const resultado = await listarClases()
    if (resultado.ok) {
      setClases(resultado.data)
      setClaseIdSeleccionada((prev) => prev ?? resultado.data[0]?.id ?? null)
    }
  }, [])

  useEffect(() => {
    void cargarClases()
  }, [cargarClases])

  useEffect(() => {
    if (!claseIdSeleccionada) return
    setEstado('cargando')
    setError(null)
    void cargarMatriculas(claseIdSeleccionada)
  }, [claseIdSeleccionada, cargarMatriculas])

  function reintentar() {
    if (!claseIdSeleccionada) return
    setEstado('cargando')
    setError(null)
    void cargarMatriculas(claseIdSeleccionada)
  }

  async function abrirDialogoRegistro() {
    setFormAlumnoId('')
    setFormClaseId('')
    setFormObservaciones('')
    setDialogoAbierto(true)

    const [alumnosRes, clasesAbiertasRes, periodoRes] = await Promise.all([
      listarAlumnos(),
      listarClasesAbiertas(),
      listarPeriodoActivo(),
    ])
    if (alumnosRes.ok) setAlumnos(alumnosRes.data)
    if (clasesAbiertasRes.ok) setClasesAbiertas(clasesAbiertasRes.data)
    if (periodoRes.ok && periodoRes.data) setPeriodoActivoId(periodoRes.data.id)
  }

  async function enviarRegistro() {
    if (!formAlumnoId || !formClaseId || !periodoActivoId || !usuario) return
    setFormEnviando(true)

    const resultado = await crearMatricula({
      alumnoId: formAlumnoId,
      claseId: formClaseId,
      periodoId: periodoActivoId,
      observaciones: formObservaciones || undefined,
    })

    setFormEnviando(false)

    if (resultado.ok === false) {
      notificarError(resultado.error)
      return
    }
    setDialogoAbierto(false)
    notificarExito('Matrícula registrada')
    if (claseIdSeleccionada) void cargarMatriculas(claseIdSeleccionada)
  }

  async function ejecutarAccion() {
    if (!dialogoAccion) return
    setAccionEnviando(true)

    const resultado =
      dialogoAccion.tipo === 'retirar'
        ? await retirarMatricula(dialogoAccion.matricula.id)
        : await anularMatricula(dialogoAccion.matricula.id)

    setAccionEnviando(false)

    if (resultado.ok === false) {
      notificarError(resultado.error)
      return
    }
    notificarExito(dialogoAccion.tipo === 'retirar' ? 'Matrícula retirada' : 'Matrícula anulada')
    setDialogoAccion(null)
    setConfirmacionAnulada(false)
    if (claseIdSeleccionada) void cargarMatriculas(claseIdSeleccionada)
  }

  async function abrirDetalle(m: Matricula) {
    setDetalle(m)
    setDetalleAbierto(true)
    setDetalleCargando(true)
    setDetalleError(null)
    detalleAbiertoRef.current = m.id
    try {
      const res = await obtenerMatricula(m.id)
      // Ignorar respuesta tardía si el usuario cerró o cambió de fila (M1/M2)
      if (detalleAbiertoRef.current !== m.id) return
      if (res.ok === false) {
        setDetalleError(res.error)
      } else {
        setDetalle(res.data)
      }
    } catch (e) {
      if (detalleAbiertoRef.current !== m.id) return
      setDetalleError(e instanceof ApiError ? e.message : 'No se pudo cargar el detalle.')
    } finally {
      if (detalleAbiertoRef.current === m.id) setDetalleCargando(false)
    }
  }

  const clasesMap = useMemo(() => {
    const map = new Map<string, Clase>()
    for (const c of clases) map.set(c.id, c)
    return map
  }, [clases])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matrículas"
        description="Proceso de matrícula escolar"
        icon={<ClipboardList />}
        actions={
          <Can permission="matriculas.crear">
            <Button onClick={abrirDialogoRegistro}>
              <Plus className="size-4" aria-hidden />
              Registrar matrícula
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full max-w-sm">
          <Label htmlFor="filtro-clase-mat" className="mb-1.5 block">Clase</Label>
          <Select
            value={claseIdSeleccionada ?? ''}
            onValueChange={(v) => setClaseIdSeleccionada(v as string)}
          >
            <SelectTrigger id="filtro-clase-mat" className="w-full">
              <SelectValue placeholder="Seleccionar clase" />
            </SelectTrigger>
            <SelectContent>
              <ClasesAgrupadas clases={clases} />
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrículas de la clase</CardTitle>
          <CardDescription>
            {estado === 'ok' && matriculas.length > 0
              ? `${matriculas.length} matrícula${matriculas.length !== 1 ? 's' : ''} registrada${matriculas.length !== 1 ? 's' : ''}`
              : 'Listado de matrículas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estado === 'error' && (
            <ErrorState
              message={error ?? 'No se pudieron cargar las matrículas.'}
              onRetry={reintentar}
            />
          )}

          {estado === 'cargando' && (
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && matriculas.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay matrículas en esta clase.
            </p>
          )}

          {estado === 'ok' && matriculas.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((m) => {
                  const clase = clasesMap.get(m.claseId)
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>
                            {m.alumno
                              ? `${m.alumno.nombres} ${m.alumno.apellidos}`
                              : '—'}
                          </span>
                          {m.alumno && (
                            <span className="text-xs text-muted-foreground">
                              DNI: {m.alumno.dni}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {clase
                          ? `${clase.gradoNombre} · ${clase.seccionNombre}`
                          : '—'}
                      </TableCell>
                      <TableCell>{formatearFecha(m.fechaRegistro)}</TableCell>
                      <TableCell>
                        <Badge variant={m.estado === 'ACTIVA' ? 'success' : 'outline'}>
                          {m.estado === 'ACTIVA' ? 'Activa' : 'Retirada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Ver detalle de ${m.alumno ? `${m.alumno.nombres} ${m.alumno.apellidos}` : 'matrícula'}`}
                            onClick={() => void abrirDetalle(m)}
                          >
                            <Eye className="size-3" aria-hidden />
                          </Button>
                          {m.estado === 'ACTIVA' && (
                            <Can permission="matriculas.anular">
                              <Button
                                variant="outline"
                                size="xs"
                                aria-label="Retirar al alumno de la clase"
                                onClick={() => {
                                  setDialogoAccion({ tipo: 'retirar', matricula: m })
                                  setConfirmacionAnulada(false)
                                }}
                              >
                                <UserMinus className="size-3" aria-hidden />
                                Retirar
                              </Button>
                              <Button
                                variant="destructive"
                                size="xs"
                                aria-label="Anular matrícula permanentemente"
                                onClick={() => {
                                  setDialogoAccion({ tipo: 'anular', matricula: m })
                                  setConfirmacionAnulada(false)
                                }}
                              >
                                <Ban className="size-3" aria-hidden />
                                Anular
                              </Button>
                            </Can>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar matrícula</DialogTitle>
            <DialogDescription>
              Seleccione el alumno y la clase para registrar una nueva matrícula.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <CampoFormulario label="Alumno" id="mat-alumno" required>
              <Select value={formAlumnoId} onValueChange={(v) => setFormAlumnoId(v as string)}>
                <SelectTrigger id="mat-alumno" className="w-full">
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
            </CampoFormulario>

            <CampoFormulario label="Clase" id="mat-clase" required>
              <Select value={formClaseId} onValueChange={(v) => setFormClaseId(v as string)}>
                <SelectTrigger id="mat-clase" className="w-full">
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  <ClasesAgrupadas clases={clasesAbiertas} />
                </SelectContent>
              </Select>
            </CampoFormulario>

            <div className="grid gap-2">
              <Label htmlFor="obs">Observaciones (opcional)</Label>
              <Input
                id="obs"
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={enviarRegistro}
              disabled={!formAlumnoId || !formClaseId || !periodoActivoId || formEnviando}
            >
              {formEnviando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoAccion !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoAccion(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogoAccion?.tipo === 'anular' && (
                <AlertTriangle className="size-5 text-destructive" aria-hidden />
              )}
              {dialogoAccion?.tipo === 'retirar'
                ? 'Retirar matrícula'
                : 'Anular matrícula'}
            </DialogTitle>
            <DialogDescription>
              {dialogoAccion?.tipo === 'retirar' ? (
                <>
                  El alumno dejará de estar matriculado pero{' '}
                  <strong>podrás volver a matricularlo</strong>. Se conserva el historial académico.
                </>
              ) : (
                <>
                  Se <strong>eliminará permanentemente</strong> la matrícula y no se puede deshacer.
                  Solo es posible si el alumno no tiene calificaciones ni pagos asociados.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {dialogoAccion?.tipo === 'anular' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <Checkbox
                id="confirmar-anulacion"
                checked={confirmacionAnulada}
                onCheckedChange={(v) => setConfirmacionAnulada(v === true)}
                disabled={accionEnviando}
              />
              <Label htmlFor="confirmar-anulacion" className="cursor-pointer text-sm leading-snug">
                Entiendo que la anulación es permanente y no se puede deshacer.
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoAccion(null)}
              disabled={accionEnviando}
            >
              Cancelar
            </Button>
            <Button
              variant={dialogoAccion?.tipo === 'anular' ? 'destructive' : 'default'}
              onClick={ejecutarAccion}
              disabled={accionEnviando || (dialogoAccion?.tipo === 'anular' && !confirmacionAnulada)}
            >
              {accionEnviando
                ? 'Procesando...'
                : dialogoAccion?.tipo === 'retirar'
                  ? 'Retirar'
                  : 'Anular definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalle de matrícula (P4) */}
      <Sheet
        open={detalleAbierto}
        onOpenChange={(o) => {
          if (!o) {
            setDetalleAbierto(false)
            detalleAbiertoRef.current = null
            setDetalle(null)
            setDetalleError(null)
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle de matrícula</SheetTitle>
            <SheetDescription>
              {detalle?.alumno
                ? `${detalle.alumno.nombres} ${detalle.alumno.apellidos}`
                : 'Información completa de la matrícula'}
            </SheetDescription>
          </SheetHeader>

          {detalleCargando && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}

          {!detalleCargando && detalleError && (
            <InlineError message={detalleError} />
          )}

          {!detalleCargando && !detalleError && detalle && (
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Alumno</dt>
                <dd className="font-medium">
                  {detalle.alumno
                    ? `${detalle.alumno.nombres} ${detalle.alumno.apellidos}`
                    : '—'}
                </dd>
              </div>
              {detalle.alumno?.dni && (
                <div>
                  <dt className="text-muted-foreground">DNI</dt>
                  <dd className="font-medium">{detalle.alumno.dni}</dd>
                </div>
              )}
              {detalle.alumno?.codigoInstitucional && (
                <div>
                  <dt className="text-muted-foreground">Código institucional</dt>
                  <dd className="font-medium">{detalle.alumno.codigoInstitucional}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Clase</dt>
                <dd className="font-medium">
                  {(() => {
                    const clase = clasesMap.get(detalle.claseId)
                    return clase
                      ? `${clase.gradoNombre} · ${clase.seccionNombre}`
                      : detalle.claseId
                  })()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fecha de registro</dt>
                <dd className="font-medium">{formatearFecha(detalle.fechaRegistro)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd>
                  <Badge variant={detalle.estado === 'ACTIVA' ? 'success' : 'outline'}>
                    {detalle.estado === 'ACTIVA' ? 'Activa' : 'Retirada'}
                  </Badge>
                </dd>
              </div>
              {detalle.retiradoAt && (
                <div>
                  <dt className="text-muted-foreground">Retirada el</dt>
                  <dd className="font-medium">{formatearFecha(detalle.retiradoAt)}</dd>
                </div>
              )}
              {detalle.observaciones && (
                <div>
                  <dt className="text-muted-foreground">Observaciones</dt>
                  <dd>{detalle.observaciones}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDetalleAbierto(false)
                detalleAbiertoRef.current = null
                setDetalle(null)
                setDetalleError(null)
              }}
            >
              Cerrar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
