import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { listarAlumnos, crearAlumno, actualizarAlumno, desactivarAlumno, reactivarAlumno, type Alumno } from '@/services/alumnosService'
import { useBuscador } from '@/hooks/useBuscador'
import { TableResponsive, LoadingState, Paginacion } from '@/components/common'
import { useFormValidation, formSchemas } from '@/hooks/useFormValidation'
import { Users, RefreshCcw, AlertTriangle, Plus, Edit, Trash2, SearchX, Search, RotateCcw, Eye } from 'lucide-react'

type EstadoFiltro = 'TODOS' | 'ACTIVO' | 'INACTIVO'

export function AlumnosPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('TODOS')

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [modoEdicion, _setModoEdicion] = useState(false)
  const [alumnoEditando, _setAlumnoEditando] = useState<Alumno | null>(null)

  const [dialogoDesactivar, setDialogoDesactivar] = useState<Alumno | null>(null)
  const [desactivando, setDesactivando] = useState(false)
  const [desactivarError, setDesactivarError] = useState<string | null>(null)

  const [dialogoReactivar, setDialogoReactivar] = useState<Alumno | null>(null)
  const [reactivando, setReactivando] = useState(false)
  const [reactivarError, setReactivarError] = useState<string | null>(null)

  // react-hook-form con zod
  const form = useFormValidation(formSchemas.alumno, {
    defaultValues: {
      dni: '',
      nombres: '',
      apellidos: '',
      correo: undefined,
      telefono: undefined,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // Columnas para la tabla responsive
  const columnasAlumnos = [
    {
      key: "dni",
      header: "DNI",
      render: (a: Alumno) => <span className="font-medium">{a.dni}</span>,
      sortable: true,
      sortValue: (a) => a.dni,
    },
    {
      key: "nombres",
      header: "Nombres",
      render: (a) => a.nombres,
      sortable: true,
      sortValue: (a) => a.nombres,
    },
    {
      key: "apellidos",
      header: "Apellidos",
      render: (a) => a.apellidos,
      sortable: true,
      sortValue: (a) => a.apellidos,
    },
    { key: "codigoInstitucional", header: "Código", render: (a) => a.codigoInstitucional },
    {
      key: "estado",
      header: "Estado",
      render: (a) => (
        <Badge variant={a.estado === 'ACTIVO' ? 'success' : 'outline'}>
          {a.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      hideOnMobile: true,
      render: (alumno) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate(`/alumnos/${alumno.id}`)}
            aria-label={`Ver ficha de ${alumno.nombres} ${alumno.apellidos}`}
          >
            <Eye className="size-3" aria-hidden />
            Ver
          </Button>
          <Can permission="alumnos.editar">
            <Button
              variant="outline"
              size="xs"
              onClick={() => abrirDialogoEditar(alumno)}
            >
              <Edit className="size-3" aria-hidden />
              Editar
            </Button>
          </Can>
          <Can permission="alumnos.eliminar">
            {alumno.estado === 'ACTIVO' && (
              <Button
                variant="destructive"
                size="xs"
                onClick={() => abrirConfirmacionDesactivar(alumno)}
                aria-label={`Dar de baja a ${alumno.nombres} ${alumno.apellidos}`}
              >
                <Trash2 className="size-3" aria-hidden />
                Dar de baja
              </Button>
            )}
          </Can>
          <Can permission="alumnos.editar">
            {alumno.estado === 'INACTIVO' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => abrirConfirmacionReactivar(alumno)}
                aria-label={`Volver a activar a ${alumno.nombres} ${alumno.apellidos}`}
              >
                <RotateCcw className="size-3" aria-hidden />
                Volver a activar
              </Button>
            )}
          </Can>
        </div>
      ),
    },
  ]

  const buscador = useBuscador(alumnos, (a) => [
    a.dni,
    a.nombres,
    a.apellidos,
    a.codigoInstitucional,
  ])

  const cargarAlumnos = useCallback(async () => {
    const estadoFiltro = filtroEstado === 'TODOS' ? undefined : filtroEstado
    const resultado = await listarAlumnos(estadoFiltro)
    if (resultado.ok === false) {
      setError(resultado.error)
      setEstado('error')
    } else {
      setAlumnos(resultado.data)
      setEstado('ok')
    }
  }, [filtroEstado])

  useEffect(() => {
    void cargarAlumnos()
  }, [cargarAlumnos])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargarAlumnos()
  }

  function abrirDialogoCrear() {
    reset({
      dni: '',
      nombres: '',
      apellidos: '',
      correo: undefined,
      telefono: undefined,
    })
    setDialogoAbierto(true)
  }

  function abrirDialogoEditar(alumno: Alumno) {
    reset({
      dni: alumno.dni,
      nombres: alumno.nombres,
      apellidos: alumno.apellidos,
      correo: alumno.correo ?? undefined,
      telefono: alumno.telefono ?? undefined,
    })
    setDialogoAbierto(true)
  }

  function cerrarDialogo() {
    form.reset()
    setDialogoAbierto(false)
  }

  async function onSubmit(data: z.infer<typeof formSchemas.alumno>) {
    const resultado = await (modoEdicion && alumnoEditando
      ? actualizarAlumno(alumnoEditando!.id, data)
      : crearAlumno(data))

    if (resultado.ok === false) {
      // El error se muestra en el formulario
      return
    }

    form.reset()
    setDialogoAbierto(false)
    void cargarAlumnos()
  }

  function abrirConfirmacionDesactivar(alumno: Alumno) {
    setDialogoDesactivar(alumno)
    setDesactivarError(null)
  }

  async function ejecutarDesactivar() {
    if (!dialogoDesactivar) return
    setDesactivando(true)
    setDesactivarError(null)

    const resultado = await desactivarAlumno(dialogoDesactivar.id)

    setDesactivando(false)

    if (resultado.ok === false) {
      setDesactivarError(resultado.error)
      return
    }

    setDialogoDesactivar(null)
    void cargarAlumnos()
  }

  function abrirConfirmacionReactivar(alumno: Alumno) {
    setDialogoReactivar(alumno)
    setReactivarError(null)
  }

  async function ejecutarReactivar() {
    if (!dialogoReactivar) return
    setReactivando(true)
    setReactivarError(null)

    const resultado = await reactivarAlumno(dialogoReactivar.id)

    setReactivando(false)

    if (resultado.ok === false) {
      setReactivarError(resultado.error)
      return
    }

    setDialogoReactivar(null)
    void cargarAlumnos()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alumnos"
        description="Gestión del alumnado"
        icon={<Users />}
        actions={
          <Can permission="alumnos.crear">
            <Button onClick={abrirDialogoCrear}>
              <Plus className="size-4" aria-hidden />
              Registrar alumno
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full max-w-xs">
          <Label htmlFor="filtro-estado" className="mb-1.5 block">Filtrar por estado</Label>
          <Select
            value={filtroEstado}
            onValueChange={(v) => {
              setFiltroEstado(v as EstadoFiltro)
              buscador.setPagina(1)
            }}
          >
            <SelectTrigger id="filtro-estado" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full max-w-xs">
          <Label htmlFor="buscarAlumno" className="mb-1.5 block">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="buscarAlumno"
              value={buscador.busqueda}
              onChange={(e) => buscador.setBusqueda(e.target.value)}
              placeholder="Por DNI, nombres o apellidos"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de alumnos</CardTitle>
          <CardDescription>
            {estado === 'ok' && alumnos.length > 0
              ? buscador.busqueda.trim()
                ? `${buscador.total} resultado${buscador.total !== 1 ? 's' : ''} de ${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''}`
                : `${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''} registrado${alumnos.length !== 1 ? 's' : ''}`
              : 'Listado de alumnos'}
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
            <LoadingState variant="table" />
          )}

          {estado === 'ok' && alumnos.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no hay alumnos registrados.
              </p>
              <Can permission="alumnos.crear">
                <Button onClick={abrirDialogoCrear}>
                  <Plus className="size-4" aria-hidden />
                  Registrar el primer alumno
                </Button>
              </Can>
            </div>
          )}

          {estado === 'ok' && alumnos.length > 0 && buscador.total === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <SearchX className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                No se encontraron alumnos para &quot;{buscador.busqueda}&quot;.
              </p>
              <Button variant="outline" onClick={() => buscador.setBusqueda('')}>
                Limpiar búsqueda
              </Button>
            </div>
          )}

{estado === 'ok' && buscador.visibles.length > 0 && (
            <TableResponsive
              data={buscador.visibles}
              columns={columnasAlumnos}
              keyExtractor={(a) => a.id}
              emptyMessage="No hay alumnos que coincidan con la búsqueda"
            />
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

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modoEdicion ? 'Editar alumno' : 'Registrar alumno'}</DialogTitle>
            <DialogDescription>
              {modoEdicion
                ? 'Modifique los datos del alumno seleccionado.'
                : 'Complete los datos para registrar un nuevo alumno.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                placeholder="Número de DNI"
                disabled={modoEdicion}
                maxLength={8}
                {...register('dni')}
              />
              {errors.dni && (
                <p className="text-sm text-destructive" role="alert">{errors.dni.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                placeholder="Nombres"
                maxLength={100}
                {...register('nombres')}
              />
              {errors.nombres && (
                <p className="text-sm text-destructive" role="alert">{errors.nombres.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                placeholder="Apellidos"
                maxLength={100}
                {...register('apellidos')}
              />
              {errors.apellidos && (
                <p className="text-sm text-destructive" role="alert">{errors.apellidos.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="correo@ejemplo.com"
                maxLength={150}
                {...register('correo')}
              />
              {errors.correo && (
                <p className="text-sm text-destructive" role="alert">{errors.correo.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                placeholder="Número de teléfono"
                maxLength={20}
                {...register('telefono')}
              />
              {errors.telefono && (
                <p className="text-sm text-destructive" role="alert">{errors.telefono.message}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              El código institucional (E…) se genera automáticamente y es permanente.
            </p>
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cerrarDialogo}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoDesactivar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoDesactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja alumno</DialogTitle>
            <DialogDescription>
              ¿Está seguro de dar de baja a {dialogoDesactivar?.nombres} {dialogoDesactivar?.apellidos} (DNI: {dialogoDesactivar?.dni})?
              Esta acción cambiará su estado a INACTIVO. No se puede dar de baja si tiene matrículas o apoderados asociados.
            </DialogDescription>
          </DialogHeader>

          {desactivarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{desactivarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoDesactivar(null)}
              disabled={desactivando}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={ejecutarDesactivar} disabled={desactivando}>
              {desactivando ? 'Dando de baja...' : 'Dar de baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoReactivar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoReactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Volver a activar alumno</DialogTitle>
            <DialogDescription>
              ¿Está seguro de volver a activar a {dialogoReactivar?.nombres} {dialogoReactivar?.apellidos} (DNI: {dialogoReactivar?.dni})? Su estado volverá a ACTIVO.
            </DialogDescription>
          </DialogHeader>

          {reactivarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{reactivarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoReactivar(null)}
              disabled={reactivando}
            >
              Cancelar
            </Button>
            <Button onClick={ejecutarReactivar} disabled={reactivando}>
              {reactivando ? 'Volviendo a activar...' : 'Volver a activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

















