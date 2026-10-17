import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  UserCheck, Plus, AlertTriangle, RefreshCcw, Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Can } from '@/components/guards/Can'
import { etiquetaNiveles } from '@/lib/nivelesCurso'
import { listarClases, listarCursosDeClase, listarDocentes, type Clase, type Curso, type Docente } from '@/services/catalogoService'
import {
  listarAsignaciones, crearAsignacion, eliminarAsignacion, type AsignacionCurso,
} from '@/services/asignacionService'

type EstadoCarga = 'cargando' | 'ok' | 'error'

function FilasSkeleton({ columnas }: { columnas: number }) {
  return (
    <>
      {Array.from({ length: 4 }, (_, indice) => (
        <TableRow key={indice}>
          {Array.from({ length: columnas }, (_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function InputConLabel({
  label,
  id,
  children,
  required = false,
  error,
}: {
  label: string
  id: string
  children: React.ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}

export function AsignacionesPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [asignaciones, setAsignaciones] = useState<AsignacionCurso[]>([])
  const [error, setError] = useState<string | null>(null)

  const [clases, setClases] = useState<Clase[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [cursosDeClase, setCursosDeClase] = useState<Curso[]>([])
  const [cursosCargando, setCursosCargando] = useState(false)

  const [dialogoCrear, setDialogoCrear] = useState(false)
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState('')
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('')

  const [asignacionAEliminar, setAsignacionAEliminar] = useState<AsignacionCurso | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargarAsignaciones = useCallback(async () => {
    const res = await listarAsignaciones()
    if (res.ok === false) {
      setError(res.error)
      setEstado('error')
    } else {
      setAsignaciones(res.data)
      setEstado('ok')
    }
  }, [])

  const cargarCatalogos = useCallback(async () => {
    const [clasesRes, docentesRes] = await Promise.all([listarClases(), listarDocentes()])
    if (clasesRes.ok === false) {
      setError(clasesRes.error)
      setEstado('error')
      return
    }
    if (docentesRes.ok === false) {
      setError(docentesRes.error)
      setEstado('error')
      return
    }
    setClases(clasesRes.data)
    setDocentes(docentesRes.data)
    setEstado('ok')
  }, [])

  const cargarCursosDeClase = useCallback(async (claseId: string) => {
    setCursosCargando(true)
    const res = await listarCursosDeClase(claseId)
    setCursosCargando(false)
    if (res.ok) setCursosDeClase(res.data)
  }, [])

  const docentesFiltrados = useMemo(() => {
    const nivel = clases.find((cl) => cl.id === claseSeleccionada)?.nivel
    if (!nivel) return docentes
    return docentes.filter((d) => d.niveles.includes(nivel))
  }, [clases, claseSeleccionada, docentes])

  useEffect(() => {
    void cargarCatalogos()
    void cargarAsignaciones()
  }, [cargarCatalogos, cargarAsignaciones])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargarCatalogos()
    void cargarAsignaciones()
  }

  function abrirDialogoNuevaAsignacion() {
    setClaseSeleccionada('')
    setCursoSeleccionado('')
    setDocenteSeleccionado('')
    setCursosDeClase([])
    setErrorDialogo(null)
    setDialogoCrear(true)
  }

  async function cambiarClase(claseId: string) {
    setClaseSeleccionada(claseId)
    setCursoSeleccionado('')
    setDocenteSeleccionado('')
    setCursosDeClase([])
    if (claseId) await cargarCursosDeClase(claseId)
  }

  async function enviarCrear() {
    if (!claseSeleccionada || !cursoSeleccionado || !docenteSeleccionado) return
    setCreando(true)
    setErrorDialogo(null)
    const res = await crearAsignacion({
      claseId: claseSeleccionada,
      cursoId: cursoSeleccionado,
      docenteId: docenteSeleccionado,
    })
    setCreando(false)
    if (res.ok === false) {
      setErrorDialogo(res.error)
      return
    }
    setDialogoCrear(false)
    void cargarAsignaciones()
  }

  async function enviarEliminar() {
    if (!asignacionAEliminar) return
    setEliminando(true)
    const res = await eliminarAsignacion(
      asignacionAEliminar.claseId,
      asignacionAEliminar.cursoId,
      asignacionAEliminar.docenteId,
    )
    setEliminando(false)
    if (res.ok === false) {
      setErrorDialogo(res.error)
      return
    }
    setAsignacionAEliminar(null)
    void cargarAsignaciones()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asignación de docentes"
        description="Docentes asignados a cursos por clase"
        icon={<UserCheck className="size-5" />}
        actions={
          <Can permission="asignaciones.crear">
            <Button onClick={abrirDialogoNuevaAsignacion}>
              <Plus className="size-4" aria-hidden />
              Nueva asignación
            </Button>
          </Can>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asignaciones registradas</CardTitle>
          <CardDescription>
            {estado === 'ok' && asignaciones.length > 0
              ? `${asignaciones.length} asignación${asignaciones.length !== 1 ? 'es' : ''}`
              : 'Relación docente-curso-clase'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estado === 'error' && (
            <div className="grid gap-3 mb-4">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>Error al cargar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={reintentar}>
                <RefreshCcw className="size-4" aria-hidden />
                Reintentar
              </Button>
            </div>
          )}

          {estado === 'cargando' && (
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={4} />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && asignaciones.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay asignaciones registradas.
            </p>
          )}

          {estado === 'ok' && asignaciones.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaciones.map((a) => (
                  <TableRow key={`${a.claseId}-${a.cursoId}-${a.docenteId}`}>
                    <TableCell className="font-medium">
                      {a.clase.gradoNombre} {a.clase.seccionNombre}
                      <span className="text-muted-foreground"> · {a.clase.periodoCodigo}</span>
                    </TableCell>
                    <TableCell>
                      {a.curso.codigo} — {a.curso.nombre}
                    </TableCell>
                    <TableCell>
                      {a.docente.nombres} {a.docente.apellidos}
                      <span className="text-muted-foreground"> · {a.docente.dni}</span>
                    </TableCell>
                    <TableCell>
                      <Can permission="asignaciones.eliminar">
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          disabled={eliminando}
                          aria-label={`Eliminar asignación del curso ${a.curso.nombre}`}
                          onClick={() => setAsignacionAEliminar(a)}
                        >
                          <Trash2 className="size-3" aria-hidden />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogoCrear} onOpenChange={setDialogoCrear}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva asignación</DialogTitle>
            <DialogDescription>Asigne un docente a un curso en una clase específica</DialogDescription>
          </DialogHeader>

          {errorDialogo && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorDialogo}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <InputConLabel label="Clase" id="asig-clase" required>
              <Select value={claseSeleccionada} onValueChange={(v) => void cambiarClase(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  {clases.map((cl) => (
                    <SelectItem key={cl.id} value={cl.id}>
                      {cl.gradoNombre} {cl.seccionNombre} — {cl.periodoCodigo} ({cl.turno})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Curso" id="asig-curso" required>
              <Select
                value={cursoSeleccionado}
                disabled={!claseSeleccionada || cursosCargando}
                onValueChange={setCursoSeleccionado}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={claseSeleccionada ? (cursosCargando ? 'Cargando...' : 'Seleccionar curso') : 'Primero seleccione una clase'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {cursosDeClase.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Docente" id="asig-docente" required>
              <Select value={docenteSeleccionado} onValueChange={setDocenteSeleccionado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentesFiltrados.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombres} {d.apellidos} — {etiquetaNiveles(d.niveles)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputConLabel>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoCrear(false)} disabled={creando}>
              Cancelar
            </Button>
            <Button
              onClick={() => void enviarCrear()}
              disabled={creando || !claseSeleccionada || !cursoSeleccionado || !docenteSeleccionado}
            >
              {creando ? 'Creando...' : 'Crear asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={asignacionAEliminar !== null} onOpenChange={(open) => { if (!open) setAsignacionAEliminar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              {asignacionAEliminar
                ? `Se eliminará la asignación de ${asignacionAEliminar.docente.nombres} ${asignacionAEliminar.docente.apellidos} al curso ${asignacionAEliminar.curso.codigo} en ${asignacionAEliminar.clase.gradoNombre} ${asignacionAEliminar.clase.seccionNombre}.`
                : 'Se eliminará la asignación seleccionada.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsignacionAEliminar(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void enviarEliminar()} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}