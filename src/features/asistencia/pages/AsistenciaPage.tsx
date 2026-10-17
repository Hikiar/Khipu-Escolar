import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, AlertTriangle, RefreshCcw, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Can } from '@/components/guards/Can'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  listarClases, listarClasesDeDocente, listarAlumnosDeClase, type Clase, type AlumnoDeClase,
} from '@/services/catalogoService'
import {
  obtenerAsistencia, listarAsistencias, crearAsistencia, actualizarAsistencia,
  listarAlcancesDeClase,
  type EstadoAsistencia, type Asistencia, type AsistenciaResumen, type AlcancesClase,
} from '@/services/asistenciaService'


const ESTADOS: EstadoAsistencia[] = ['PRESENTE', 'TARDE', 'FALTA', 'JUSTIFICADO']

const NOMBRES_ESTADO: Record<EstadoAsistencia, string> = {
  PRESENTE: 'Presente',
  TARDE: 'Tarde',
  FALTA: 'Falta',
  JUSTIFICADO: 'Justificado',
}

interface Fila {
  alumnoId: string
  nombreCompleto: string
  dni: string
  estado: EstadoAsistencia
  observaciones: string
}

function fechaHoyLocal(): string {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}


function estadoVariant(estado: EstadoAsistencia) {
  switch (estado) {
    case 'PRESENTE':
      return 'success'
    case 'TARDE':
      return 'warning'
    case 'FALTA':
      return 'destructive'
    case 'JUSTIFICADO':
      return 'info'
  }
}

export function AsistenciaPage() {
  const { usuario, can } = useAuth()
  const [parametros] = useSearchParams()

  const [clases, setClases] = useState<Clase[]>([])
  const [claseId, setClaseId] = useState<string>(parametros.get('clase') ?? '')
  const [fecha, setFecha] = useState<string>(fechaHoyLocal())

  // Alcance: 'aula' (general del aula) o el id de un curso; '' = aún sin definir.
  const [alcances, setAlcances] = useState<AlcancesClase | null>(null)
  const [alcance, setAlcance] = useState<string>('')
  const [estadoAlcances, setEstadoAlcances] = useState<EstadoCarga>('cargando')
  const [errorAlcances, setErrorAlcances] = useState<string | null>(null)

  const [estadoClases, setEstadoClases] = useState<EstadoCarga>('cargando')
  const [errorClases, setErrorClases] = useState<string | null>(null)

  const [modo, setModo] = useState<'crear' | 'editar' | null>(null)
  const [estadoTabla, setEstadoTabla] = useState<EstadoCarga>('cargando')
  const [errorTabla, setErrorTabla] = useState<string | null>(null)
  const [filas, setFilas] = useState<Fila[]>([])
  const [registro, setRegistro] = useState<Asistencia | null>(null)
  const [observacionesRegistro, setObservacionesRegistro] = useState('')
  const [historico, setHistorico] = useState<AsistenciaResumen[]>([])
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  // Cache para evitar re-fetch innecesarios cuando cambian de usuario
  const cacheClasesDocente = useRef<Map<string, Clase[]>>(new Map())

  const claseSeleccionada = useMemo(
    () => clases.find((c) => c.id === claseId) ?? null,
    [clases, claseId],
  )

  const puedeRegistrar = usuario && can('asistencia.registrar')

  /** cursoId que corresponde al alcance activo (undefined = AULA). */
  const cursoIdActivo = alcance === 'aula' ? undefined : (alcance || undefined)

  const alcanceActual = useMemo(() => {
    if (alcance === 'aula') return { id: 'aula', nombre: 'Clase (tutor)' } as const
    return alcances?.cursos.find((c) => c.id === alcance) ?? null
  }, [alcance, alcances])

  const opcionesAlcance = useMemo(() => {
    const opciones: { id: string; nombre: string }[] = []
    if (alcances?.aula) opciones.push({ id: 'aula', nombre: 'Clase (tutor)' })
    for (const c of alcances?.cursos ?? []) opciones.push({ id: c.id, nombre: c.nombre })
    return opciones
  }, [alcances])

  useEffect(() => {
    // Alcances disponibles del usuario para la clase seleccionada.
    if (!claseId || !puedeRegistrar) {
      setAlcances(null)
      setAlcance('')
      setEstadoAlcances('ok')
      return
    }
    let activo = true
    setEstadoAlcances('cargando')
    setErrorAlcances(null)
    void listarAlcancesDeClase(claseId)
      .then((res) => {
        if (!activo) return
        if (res.ok === false) {
          setEstadoAlcances('error')
          setErrorAlcances(res.error)
          return
        }
        setAlcances(res.data)
        setEstadoAlcances('ok')
        const porDefecto = res.data.aula ? 'aula' : (res.data.cursos[0]?.id ?? '')
        setAlcance(porDefecto)
      })
    return () => {
      activo = false
    }
  }, [claseId, puedeRegistrar])

  const cargarClases = useCallback(async () => {
    // Un profesor (puede registrar asistencia pero sin acceso global a alumnos)
    // solo ve sus salones; el resto de roles ve el catálogo completo.
    const esDocente = usuario && can('asistencia.registrar') && !can('alumnos.verTodos')
    
    // Usar cache para evitar re-fetch innecesarios
    const cacheKey = esDocente ? usuario.persona.id : 'todas'
    const cached = cacheClasesDocente.current.get(cacheKey)
    
    if (cached) {
      setClases(cached)
      setEstadoClases('ok')
      return
    }
    
    const res = esDocente
      ? await listarClasesDeDocente(usuario.persona.id)
      : await listarClases()
      
    if (res.ok === false) {
      setErrorClases(res.error)
      setEstadoClases('error')
    } else {
      const data = res.data
      cacheClasesDocente.current.set(cacheKey, data)
      setClases(data)
      setEstadoClases('ok')
    }
  }, [usuario, can])

  useEffect(() => {
    void cargarClases()
  }, [cargarClases])

  const cargarDatos = useCallback(async (cId: string, fechaSel: string, cursoId?: string) => {
    if (!cId || !fechaSel) return
    setEstadoTabla('cargando')
    setErrorTabla(null)
    setErrorGuardar(null)
    const [asisRes, histRes] = await Promise.all([
      obtenerAsistencia(cId, fechaSel, cursoId),
      listarAsistencias(cId, cursoId),
    ])

    if (histRes.ok === false) {
      setHistorico([])
    } else {
      setHistorico(histRes.data)
    }

    if (asisRes.ok === false) {
      setRegistro(null)
      setObservacionesRegistro('')
      if (asisRes.motivo === 'no-encontrado') {
        const alumnosRes = await listarAlumnosDeClase(cId)
        if (alumnosRes.ok === false) {
          setErrorTabla(alumnosRes.error)
          setEstadoTabla('error')
        } else {
          setFilas(
            alumnosRes.data.map(
              (al: AlumnoDeClase) => ({
                alumnoId: al.id,
                nombreCompleto: `${al.apellidos} ${al.nombres}`.trim(),
                dni: al.dni,
                estado: 'PRESENTE' as EstadoAsistencia,
                observaciones: '',
              }),
            ),
          )
          setModo('crear')
          setEstadoTabla('ok')
        }
      } else {
        setErrorTabla(asisRes.error)
        setEstadoTabla('error')
      }
    } else {
      const a = asisRes.data
      setRegistro(a)
      setObservacionesRegistro(a.observaciones ?? '')
      setFilas(
        a.detalles.map((d) => ({
          alumnoId: d.alumnoId,
          nombreCompleto: d.alumno?.nombreCompleto ?? d.alumnoId,
          dni: '',
          estado: d.estado,
          observaciones: d.observaciones ?? '',
        })),
      )
      setModo('editar')
      setEstadoTabla('ok')
    }
  }, [])

  useEffect(() => {
    if (claseId && fecha) {
      void cargarDatos(claseId, fecha, cursoIdActivo)
    }
  }, [claseId, fecha, cursoIdActivo, cargarDatos])

  function reiniciarClases() {
    setEstadoClases('cargando')
    setErrorClases(null)
    void cargarClases()
  }

  function reintentarTabla() {
    if (claseId && fecha) {
      void cargarDatos(claseId, fecha, cursoIdActivo)
    }
  }

  function reintentarAlcances() {
    if (!claseId) return
    setEstadoAlcances('cargando')
    setErrorAlcances(null)
    void listarAlcancesDeClase(claseId).then((res) => {
      if (res.ok === false) {
        setEstadoAlcances('error')
        setErrorAlcances(res.error)
        return
      }
      setAlcances(res.data)
      setEstadoAlcances('ok')
      const porDefecto = res.data.aula ? 'aula' : (res.data.cursos[0]?.id ?? '')
      setAlcance(porDefecto)
    })
  }

  function cambiarEstado(alumnoId: string, estado: EstadoAsistencia) {
    setFilas((prev) => prev.map((f) => (f.alumnoId === alumnoId ? { ...f, estado } : f)))
  }

  function cambiarObservaciones(alumnoId: string, valor: string) {
    setFilas((prev) => prev.map((f) => (f.alumnoId === alumnoId ? { ...f, observaciones: valor } : f)))
  }

  const resumen = useMemo(() => {
    const r = { presentes: 0, tardes: 0, faltas: 0, justificados: 0 }
    for (const f of filas) {
      if (f.estado === 'PRESENTE') r.presentes++
      else if (f.estado === 'TARDE') r.tardes++
      else if (f.estado === 'FALTA') r.faltas++
      else r.justificados++
    }
    return r
  }, [filas])

  function detallesPayload() {
    return filas.map((f) => ({
      alumnoId: f.alumnoId,
      estado: f.estado,
      observaciones: f.observaciones.trim() || undefined,
    }))
  }

  async function handleCrear() {
    if (!claseId || !usuario) return
    setGuardando(true)
    setErrorGuardar(null)
    const res = await crearAsistencia({
      claseId,
      cursoId: cursoIdActivo,
      fecha,
      observaciones: observacionesRegistro.trim() || undefined,
      detalles: detallesPayload(),
    })
    setGuardando(false)
    if (res.ok === false) {
      setErrorGuardar(res.error)
      if (res.error.toLowerCase().includes('ya existe')) {
        void cargarDatos(claseId, fecha, cursoIdActivo)
      }
    } else {
      const a = res.data
      setRegistro(a)
      setFilas(
        a.detalles.map((d) => ({
          alumnoId: d.alumnoId,
          nombreCompleto: d.alumno?.nombreCompleto ?? d.alumnoId,
          dni: '',
          estado: d.estado,
          observaciones: d.observaciones ?? '',
        })),
      )
      setModo('editar')
    }
  }

  async function handleGuardar() {
    if (!registro) return
    setGuardando(true)
    setErrorGuardar(null)
    const res = await actualizarAsistencia(registro.id, {
      observaciones: observacionesRegistro.trim() || undefined,
      detalles: detallesPayload(),
    })
    setGuardando(false)
    if (res.ok === false) {
      setErrorGuardar(res.error)
    } else {
      const a = res.data
      setRegistro(a)
      setFilas(
        a.detalles.map((d) => ({
          alumnoId: d.alumnoId,
          nombreCompleto: d.alumno?.nombreCompleto ?? d.alumnoId,
          dni: '',
          estado: d.estado,
          observaciones: d.observaciones ?? '',
        })),
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asistencia"
        description="Control de asistencia diaria"
        icon={<CalendarCheck />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contexto</CardTitle>
          <CardDescription>Seleccione una clase y una fecha</CardDescription>
        </CardHeader>
        <CardContent>
          {estadoClases === 'error' && (
            <div className="grid gap-3">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>Error al cargar clases</AlertTitle>
                <AlertDescription>{errorClases}</AlertDescription>
              </Alert>
              <div>
                <Button variant="outline" onClick={reiniciarClases}>
                  <RefreshCcw className="size-4" aria-hidden />
                  Reintentar
                </Button>
              </div>
            </div>
          )}
          {estadoClases === 'cargando' && (
            <div className="flex gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-40" />
            </div>
          )}
          {estadoClases === 'ok' && (
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="asis-clase">
                  Clase
                  {clases.length > 0 && clases.some(c => c.gradoNombre)
                    ? <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><BookOpen className="size-3.5" aria-hidden />Mis clases</span>
                    : null}
                </Label>
                <Select value={claseId} onValueChange={(v: string) => setClaseId(v)} disabled={clases.length === 0}>
                  <SelectTrigger id="asis-clase" className="w-72" disabled={clases.length === 0}>
                    <SelectValue placeholder={clases.length === 0 ? 'Sin clases asignadas' : 'Seleccionar clase'} />
                  </SelectTrigger>
<SelectContent>
                    {clases.length === 0
                      ? (
                        <SelectItem value="" disabled>
                          No tiene clases asignadas para tomar asistencia
                        </SelectItem>
                      )
                      : (
                        clases.map((cl) => (
                          <SelectItem key={cl.id} value={cl.id}>
                            {cl.gradoNombre} {cl.seccionNombre} - {cl.periodoCodigo} ({cl.turno})
                          </SelectItem>
                        ))
                      )
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="asis-fecha">Fecha</Label>
                <Input id="asis-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              {claseId && puedeRegistrar && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="asis-alcance">Alcance</Label>
                  {estadoAlcances === 'cargando' && <Skeleton className="h-8 w-56" />}
                  {estadoAlcances === 'error' && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-destructive">{errorAlcances ?? 'No se pudieron cargar los alcances.'}</p>
                      <Button variant="outline" size="sm" onClick={reintentarAlcances}>
                        <RefreshCcw className="size-3.5" aria-hidden />
                        Reintentar
                      </Button>
                    </div>
                  )}
                  {estadoAlcances === 'ok' && opcionesAlcance.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No tiene alcances para registrar en esta clase.
                    </p>
                  )}
                  {estadoAlcances === 'ok' && opcionesAlcance.length > 0 && (
                    <Select value={alcance} onValueChange={(v: string) => setAlcance(v)}>
                      <SelectTrigger id="asis-alcance" className="w-56">
                        <SelectValue placeholder="Seleccionar alcance" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcionesAlcance.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {claseId && fecha && (
        <>
          {guardando && (
            <p className="text-sm text-muted-foreground">Guardando...</p>
          )}

          {modo === 'editar' && !guardando && (
            <Alert>
              <AlertTitle>Registro existente</AlertTitle>
              <AlertDescription>
                Ya existe un registro de asistencia para esta clase y fecha. Puede
                visualizarlo y guardar los cambios.
              </AlertDescription>
            </Alert>
          )}

          {modo === 'crear' && !guardando && (
            <Alert>
              <AlertTitle>Nuevo registro</AlertTitle>
              <AlertDescription>
                No existe un registro para esta clase y fecha. Complete los estados
                y registre la asistencia.
              </AlertDescription>
            </Alert>
          )}

          {errorGuardar && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{errorGuardar}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {claseSeleccionada
                  ? `${claseSeleccionada.gradoNombre} ${claseSeleccionada.seccionNombre} - ${fecha}${alcanceActual ? ` (${alcanceActual.nombre})` : ''}`
                  : 'Asistencia'}
              </CardTitle>
              {modo === 'crear' && (
                <CardDescription>
                  Alumnos con matrícula activa en la clase
                </CardDescription>
              )}
              {modo === 'editar' && (
                <CardDescription>
                  Registrado el {fecha} por {registro?.registradoPor ?? '—'}
                  {registro?.cursoId ? ' · por asignatura' : ' · por clase'}
                </CardDescription>
              )}
              <div className="flex flex-col gap-1.5 pt-2">
                <Label>Observaciones del registro</Label>
                <Input
                  value={observacionesRegistro}
                  onChange={(e) => setObservacionesRegistro(e.target.value)}
                  placeholder="Observaciones generales (opcional)"
                  disabled={!puedeRegistrar}
                />
              </div>
            </CardHeader>
            <CardContent>
              {estadoTabla === 'error' && (
                <div className="grid gap-3">
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" aria-hidden />
                    <AlertTitle>Error al cargar</AlertTitle>
                    <AlertDescription>{errorTabla}</AlertDescription>
                  </Alert>
                  <div>
                    <Button variant="outline" onClick={reintentarTabla}>
                      <RefreshCcw className="size-4" aria-hidden />
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}

              {estadoTabla === 'cargando' && (
                <Table aria-busy="true">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <FilasSkeleton columnas={3} />
                  </TableBody>
                </Table>
              )}

              {estadoTabla === 'ok' && filas.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay alumnos matriculados en esta clase
                </p>
              )}

              {estadoTabla === 'ok' && filas.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
<TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filas.map((fila) => (
                        <TableRow key={fila.alumnoId}>
                          <TableCell>
                            <div className="font-medium">{fila.nombreCompleto}</div>
                            {fila.dni && (
                              <div className="text-xs text-muted-foreground">DNI {fila.dni}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {puedeRegistrar ? (
                              <Select value={fila.estado} onValueChange={(v: string) => cambiarEstado(fila.alumnoId, v as EstadoAsistencia)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ESTADOS.map((est) => (
                                    <SelectItem key={est} value={est}>
                                      {NOMBRES_ESTADO[est]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={estadoVariant(fila.estado)}>
                                {NOMBRES_ESTADO[fila.estado]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={fila.observaciones}
                              onChange={(e) => cambiarObservaciones(fila.alumnoId, e.target.value)}
                              placeholder="Observación (opcional)"
                              disabled={!puedeRegistrar}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="success">{resumen.presentes} Presentes</Badge>
                    <Badge variant="warning">{resumen.tardes} Tardes</Badge>
                    <Badge variant="destructive">{resumen.faltas} Faltas</Badge>
                    <Badge variant="info">{resumen.justificados} Justificados</Badge>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Can permission="asistencia.registrar">
                      {modo === 'crear' && (
                        <Button onClick={() => void handleCrear()} disabled={guardando}>
                          {guardando ? 'Registrando...' : 'Registrar asistencia'}
                        </Button>
                      )}
                      {modo === 'editar' && (
                        <Button onClick={() => void handleGuardar()} disabled={guardando}>
                          {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                      )}
                    </Can>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {historico.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de la clase</CardTitle>
                <CardDescription>
                  Registros previos {alcanceActual ? `del alcance «${alcanceActual.nombre}»` : 'de asistencia'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Presentes</TableHead>
                      <TableHead>Tardes</TableHead>
                      <TableHead>Faltas</TableHead>
                      <TableHead>Justificados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.fecha}</TableCell>
                        <TableCell>{r.resumen.presentes}</TableCell>
                        <TableCell>{r.resumen.tardes}</TableCell>
                        <TableCell>{r.resumen.faltas}</TableCell>
                        <TableCell>{r.resumen.justificados}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
