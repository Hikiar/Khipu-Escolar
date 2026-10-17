import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
import { useCallback, useEffect, useState } from 'react'
import { GraduationCap, Plus, Edit2, Trash2, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react'
import type { ResultadoServicio } from '@/types/operations'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Can } from '@/components/guards/Can'
import {
  listarModelos, crearModelo, actualizarModelo, eliminarModelo,
  type ModeloEvaluacion, type CrearModeloInput, type ActualizarModeloInput,
} from '@/services/modeloService'


type ModoDialogo = 'crear' | 'editar'

interface EstadoDialogo {
  abierto: boolean
  modo: ModoDialogo
  modelo: ModeloEvaluacion | null
}


export function ModelosPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [modelos, setModelos] = useState<ModeloEvaluacion[]>([])
  const [error, setError] = useState<string | null>(null)

  const [dialogo, setDialogo] = useState<EstadoDialogo>({
    abierto: false,
    modo: 'crear',
    modelo: null,
  })

  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formActivo, setFormActivo] = useState(true)
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [modeloPorEliminar, setModeloPorEliminar] = useState<ModeloEvaluacion | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const res = await listarModelos()
    if (res.ok) {
      setModelos(res.data)
      setEstado('ok')
    } else {
      setError('No se pudo cargar la lista de modelos.')
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

  function abrirDialogoCrear() {
    setFormCodigo('')
    setFormNombre('')
    setFormDescripcion('')
    setFormActivo(true)
    setErrorDialogo(null)
    setDialogo({ abierto: true, modo: 'crear', modelo: null })
  }

  function abrirDialogoEditar(modelo: ModeloEvaluacion) {
    setFormCodigo(modelo.codigo)
    setFormNombre(modelo.nombre)
    setFormDescripcion(modelo.descripcion ?? '')
    setFormActivo(modelo.activo)
    setErrorDialogo(null)
    setDialogo({ abierto: true, modo: 'editar', modelo })
  }

  function cerrarDialogo() {
    setDialogo({ abierto: false, modo: 'crear', modelo: null })
    setErrorDialogo(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formNombre.trim()) return

    setEnviando(true)
    setErrorDialogo(null)

    let res: ResultadoServicio<ModeloEvaluacion>

    if (dialogo.modo === 'crear') {
      const input: CrearModeloInput = {
        codigo: formCodigo.trim().toUpperCase(),
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || undefined,
      }
      res = await crearModelo(input)
    } else {
      const patch: ActualizarModeloInput = {
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || undefined,
        activo: formActivo,
      }
      if (!dialogo.modelo) {
        setEnviando(false)
        return
      }
      res = await actualizarModelo(dialogo.modelo.id, patch)
    }

    setEnviando(false)

    if (res.ok) {
      cerrarDialogo()
      void cargar()
    } else {
      setErrorDialogo(typeof res === 'object' && 'error' in res ? res.error : 'Error desconocido')
    }
  }

  async function confirmarEliminar() {
    if (!modeloPorEliminar) return
    setEliminando(true)
    setErrorEliminar(null)

    const res = await eliminarModelo(modeloPorEliminar.id)
    setEliminando(false)
    if (res.ok) {
      setModeloPorEliminar(null)
      void cargar()
    } else {
      const msg = 'error' in res ? res.error : 'No se pudo eliminar.'
      setErrorEliminar(msg)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tipos de calificación"
        description="Tipos de calificación configurables para competencias o exámenes."
        icon={<GraduationCap className="size-5" />}
        actions={
          <Can permission="modelos.crear">
            <Button onClick={abrirDialogoCrear}>
              <Plus className="size-4" />
              Crear modelo
            </Button>
          </Can>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de modelos</CardTitle>
          <CardDescription>
            {estado === 'ok' && modelos.length > 0
              ? `${modelos.length} modelo${modelos.length !== 1 ? 's' : ''} registrado${modelos.length !== 1 ? 's' : ''}`
              : 'Listado de tipos de calificación'}
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
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && modelos.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay tipos de calificación registrados.
            </p>
          )}

          {estado === 'ok' && modelos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelos.map((modelo) => (
                  <TableRow key={modelo.id}>
                    <TableCell className="font-mono font-medium">{modelo.codigo}</TableCell>
                    <TableCell className="font-medium">{modelo.nombre}</TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      {modelo.descripcion ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={modelo.activo ? 'success' : 'outline'}>
                        {modelo.activo ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Can permission="modelos.editar">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => abrirDialogoEditar(modelo)}
                            aria-label={`Editar ${modelo.nombre}`}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                        </Can>
                        <Can permission="modelos.eliminar">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setModeloPorEliminar(modelo)}
                            aria-label={`Eliminar ${modelo.nombre}`}
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
            <DialogTitle>{dialogo.modo === 'crear' ? 'Crear modelo' : 'Editar modelo'}</DialogTitle>
            <DialogDescription>
              {dialogo.modo === 'crear'
                ? 'Registre un nuevo modelo de evaluación'
                : `Editando: ${dialogo.modelo?.nombre}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 py-2">
              {errorDialogo && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" aria-hidden />
                  <AlertDescription>{errorDialogo}</AlertDescription>
                </Alert>
              )}

              {dialogo.modo === 'crear' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="codigo">Código <span className="text-destructive">*</span></Label>
                  <Input
                    id="codigo"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: COMPETENCIAS, EXAMEN"
                    maxLength={50}
                    required
                    disabled={enviando}
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único, mayúsculas y sin espacios.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span></Label>
                <Input
                  id="nombre"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Nombre del modelo"
                  maxLength={100}
                  required
                  disabled={enviando}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Descripción opcional"
                  rows={3}
                  disabled={enviando}
                />
              </div>

              {dialogo.modo === 'editar' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="activo"
                    checked={formActivo}
                    onCheckedChange={(v) => setFormActivo(v === true)}
                    disabled={enviando}
                  />
                  <Label htmlFor="activo" className="cursor-pointer">
                    Activo
                  </Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarDialogo} disabled={enviando}>
                Cancelar
              </Button>
              <Can permission={dialogo.modo === 'crear' ? 'modelos.crear' : 'modelos.editar'}>
                <Button type="submit" disabled={enviando || !formNombre.trim()}>
                  {enviando ? <Loader2 className="size-4 animate-spin" /> : dialogo.modo === 'crear' ? 'Crear' : 'Guardar'}
                </Button>
              </Can>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modeloPorEliminar !== null}
        onOpenChange={(open) => {
          if (!open) setModeloPorEliminar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar modelo</DialogTitle>
            <DialogDescription>
              ¿Eliminar el modelo <strong>{modeloPorEliminar?.nombre}</strong> (
              {modeloPorEliminar?.codigo})? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {errorEliminar && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorEliminar}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModeloPorEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Eliminar modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}