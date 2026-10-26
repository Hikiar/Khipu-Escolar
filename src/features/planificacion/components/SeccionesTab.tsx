import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Layers, Plus, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Can } from '@/components/guards/Can'
import { NIVELES, NIVEL_LABELS, type NivelCurricular } from '@/lib/nivelesCurso'
import { useGradosTab } from '../hooks/useGradosTab'
import { useSeccionDetalle } from '../hooks/useSeccionDetalle'
import { useGuardiaCambios } from '../hooks/useGuardiaCambios'
import { ListaSecciones } from './secciones/ListaSecciones'
import { SeccionDetallePanel } from './secciones/SeccionDetallePanel'
import { GuardiaCambiosDialog } from './secciones/GuardiaCambiosDialog'
import { GradoFormDialog } from './grados/GradoFormDialog'
import { SeccionFormDialog } from './grados/SeccionFormDialog'
import { EliminarGradoDialog } from './grados/EliminarGradoDialog'
import { EliminarSeccionDialog } from './grados/EliminarSeccionDialog'
import { ClaseFormDialog } from './clases/ClaseFormDialog'
import { listarCursosDeGrado, type CursoGrado } from '@/services/cursosService'

export interface GuardiaSecciones {
  sucio: boolean
  guardar: () => Promise<boolean>
  descartar: () => void
}

type FiltroNivel = 'TODOS' | NivelCurricular
type Pendiente = { tipo: 'seleccionar'; id: string } | { tipo: 'cerrar' } | null

const OPCIONES_NIVEL: { valor: FiltroNivel; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  ...NIVELES.map((nivel) => ({ valor: nivel, etiqueta: NIVEL_LABELS[nivel] })),
]

/**
 * Vista de secciones: cuadrícula de tarjetas de grados y secciones con filtros por
 * nivel y búsqueda. El detalle (tutor/docentes) se abre en un panel lateral (Sheet).
 */
export function SeccionesTab({
  guardiaRef,
}: {
  guardiaRef: MutableRefObject<GuardiaSecciones | null>
}) {
  const g = useGradosTab()
  const [seleccionId, setSeleccionId] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<Pendiente>(null)
  const [planesPorGrado, setPlanesPorGrado] = useState<Record<string, CursoGrado[]>>({})
  const planesCargadosRef = useRef<Set<string>>(new Set())

  const [filtroNivel, setFiltroNivel] = useState<FiltroNivel>('TODOS')
  const [busqueda, setBusqueda] = useState('')

  const claseSel = seleccionId ? g.clasesPorSeccion.get(seleccionId) : undefined
  const detalle = useSeccionDetalle(claseSel?.id ?? '')
  const guardia = useGuardiaCambios({ sucio: detalle.sucio, guardar: detalle.guardar })

  // Expone el estado de guardado al contenedor para proteger el cambio de pestaña.
  useEffect(() => {
    guardiaRef.current = {
      sucio: detalle.sucio,
      guardar: detalle.guardar,
      descartar: detalle.cancelarEdicion,
    }
  }, [guardiaRef, detalle.sucio, detalle.guardar, detalle.cancelarEdicion])

  useEffect(() => () => { guardiaRef.current = null }, [guardiaRef])

  // Carga las secciones y el plan de cada grado para la lista maestra.
  const gradosKey = g.grados.map((grado) => grado.id).join(',')
  useEffect(() => {
    if (g.gradosEstado !== 'ok') return
    for (const grado of g.grados) {
      if (grado.seccionesEstado !== 'ok') void g.recargarSecciones(grado.id)
    }
    for (const grado of g.grados) {
      if (planesCargadosRef.current.has(grado.id)) continue
      planesCargadosRef.current.add(grado.id)
      void listarCursosDeGrado(grado.id).then(
        (res) => {
          if (!res.ok) {
            planesCargadosRef.current.delete(grado.id)
            return
          }
          setPlanesPorGrado((prev) => ({ ...prev, [grado.id]: res.data }))
        },
        () => {
          planesCargadosRef.current.delete(grado.id)
        },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradosKey, g.gradosEstado])

  // Reintenta el detalle si la clase se creó después de cargar la lista interna.
  const recargadoRef = useRef<string | null>(null)
  useEffect(() => {
    const id = claseSel?.id
    if (!id || detalle.clase) return
    if (detalle.estado !== 'ok') return
    if (recargadoRef.current === id) return
    recargadoRef.current = id
    void detalle.recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claseSel?.id, detalle.clase, detalle.estado, detalle.recargar])

  const termino = busqueda.trim().toLowerCase()

  const gradosVisibles = useMemo(() => {
    const resultado: typeof g.grados = []
    for (const grado of g.grados) {
      if (filtroNivel !== 'TODOS' && grado.nivel !== filtroNivel) continue
      const secciones = grado.secciones ?? []
      const coincideGrado =
        !termino ||
        grado.nombre.toLowerCase().includes(termino) ||
        grado.codigo.toLowerCase().includes(termino)
      if (grado.seccionesEstado === 'ok' && termino && !coincideGrado) {
        const filtradas = secciones.filter((seccion) =>
          seccion.nombre.toLowerCase().includes(termino),
        )
        if (filtradas.length === 0) continue
        resultado.push({ ...grado, secciones: filtradas })
      } else {
        resultado.push(grado)
      }
    }
    return resultado
  }, [g.grados, filtroNivel, termino])

  const abrirDetalle = (id: string) => {
    if (id === seleccionId) return
    setSeleccionId(id)
  }

  const seleccionar = (id: string) => {
    if (id === seleccionId) return
    if (detalle.sucio) {
      setPendiente({ tipo: 'seleccionar', id })
      return
    }
    abrirDetalle(id)
  }

  const cerrarDetalle = () => {
    if (detalle.sucio) {
      setPendiente({ tipo: 'cerrar' })
      return
    }
    setSeleccionId(null)
  }

  const crearClase = (gradoId: string, seccionId: string) => {
    setSeleccionId(`${gradoId}:${seccionId}`)
    g.abrirDialogoCrearClase(gradoId, seccionId)
  }

  const aplicarDestinoPendiente = () => {
    const destino = pendiente
    setPendiente(null)
    if (!destino) return
    if (destino.tipo === 'seleccionar') setSeleccionId(destino.id)
    else setSeleccionId(null)
  }

  const [gradoSel, seccionSel] = seleccionId ? seleccionId.split(':') : ['', '']

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filtrar por nivel">
            {OPCIONES_NIVEL.map((opcion) => {
              const activo = filtroNivel === opcion.valor
              return (
                <Button
                  key={opcion.valor}
                  size="sm"
                  variant={activo ? 'secondary' : 'ghost'}
                  aria-pressed={activo}
                  onClick={() => setFiltroNivel(opcion.valor)}
                >
                  {opcion.etiqueta}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar grado o sección"
                aria-label="Buscar grado o sección"
                className="pl-8 sm:w-64"
              />
            </div>
            <Can permission="grados.crear">
              <Button size="sm" onClick={g.abrirDialogoCrearGrado}>
                <Plus className="mr-1.5 size-4" aria-hidden />
                Grado
              </Button>
            </Can>
          </div>
        </div>

        <ListaSecciones
          gradosEstado={g.gradosEstado}
          grados={gradosVisibles}
          hayFiltros={filtroNivel !== 'TODOS' || termino.length > 0}
          seleccionId={seleccionId}
          onSeleccionar={seleccionar}
          clasesPorSeccion={g.clasesPorSeccion}
          docentesPorId={g.docentesPorId}
          planesPorGrado={planesPorGrado}
          asignacionesPorClase={g.asignacionesPorClase}
          puedeAsignaciones={g.puedeAsignaciones}
          onCrearGrado={g.abrirDialogoCrearGrado}
          onEditarGrado={g.abrirDialogoEditarGrado}
          onEliminarGrado={g.setGradoPorEliminar}
          onCrearSeccion={g.abrirDialogoCrearSeccion}
          onRecargarSecciones={(gradoId) => void g.recargarSecciones(gradoId)}
        />
      </div>

      <Sheet open={seleccionId !== null} onOpenChange={(open) => { if (!open) cerrarDetalle() }}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 data-[side=right]:sm:max-w-2xl data-[side=right]:lg:max-w-3xl"
        >
          <SheetTitle className="sr-only">Detalle de la sección</SheetTitle>
          <div className="flex-1 overflow-y-auto p-4 pt-12">
            {!claseSel ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Layers className="mx-auto size-12 text-muted-foreground/50" aria-hidden />
                  <h4 className="mt-4 text-lg font-medium">Sección sin clase</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Esta sección todavía no tiene una clase en el año lectivo activo.
                  </p>
                  {g.puedeCrearClase && (
                    <Button onClick={() => crearClase(gradoSel, seccionSel)}>
                      <Plus className="mr-2 size-4" aria-hidden />
                      Crear clase
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <SeccionDetallePanel
                detalle={detalle}
                onEliminada={() => {
                  setSeleccionId(null)
                  void g.recargarClases()
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <GuardiaCambiosDialog
        abierto={pendiente !== null}
        guardando={detalle.guardando}
        onDescartar={() => {
          detalle.cancelarEdicion()
          aplicarDestinoPendiente()
        }}
        onGuardar={() => {
          void detalle.guardar().then(
            (ok) => {
              if (ok) aplicarDestinoPendiente()
            },
            () => {},
          )
        }}
        onSeguirEditando={() => setPendiente(null)}
      />

      <GuardiaCambiosDialog
        abierto={!!guardia.destino}
        guardando={guardia.guardandoSalida}
        onDescartar={guardia.descartar}
        onGuardar={() => void guardia.guardarYSalir()}
        onSeguirEditando={guardia.seguirEditando}
      />

      <GradoFormDialog
        dialogoGrado={g.dialogoGrado}
        cerrarDialogoGrado={g.cerrarDialogoGrado}
        formGrado={g.formGrado}
        setFormGrado={g.setFormGrado}
        formGradoErrores={g.formGradoErrores}
        formGradoEnviando={g.formGradoEnviando}
        gradoSugeridoId={g.gradoSugeridoId}
        setGradoSugeridoId={g.setGradoSugeridoId}
        aplicarGradoSugerido={g.aplicarGradoSugerido}
        enviarGrado={g.enviarGrado}
      />

      <SeccionFormDialog
        dialogoSeccion={g.dialogoSeccion}
        cerrarDialogoSeccion={g.cerrarDialogoSeccion}
        formSeccion={g.formSeccion}
        setFormSeccion={g.setFormSeccion}
        formSeccionErrores={g.formSeccionErrores}
        formSeccionEnviando={g.formSeccionEnviando}
        enviarSeccion={g.enviarSeccion}
      />

      <EliminarGradoDialog
        gradoPorEliminar={g.gradoPorEliminar}
        setGradoPorEliminar={g.setGradoPorEliminar}
        eliminandoGrado={g.eliminandoGrado}
        manejarEliminarGrado={g.manejarEliminarGrado}
      />

      <EliminarSeccionDialog
        seccionPorEliminar={g.seccionPorEliminar}
        setSeccionPorEliminar={g.setSeccionPorEliminar}
        eliminandoSeccion={g.eliminandoSeccion}
        manejarEliminarSeccion={g.manejarEliminarSeccion}
      />

      <ClaseFormDialog
        dialogoClase={{ abierto: g.dialogoClase.abierto, modo: 'crear', clase: undefined }}
        cerrarDialogoClase={g.cerrarDialogoClase}
        formClase={g.formClase}
        setFormClase={g.setFormClase}
        formClaseErrores={g.formClaseErrores}
        formClaseEnviando={g.formClaseEnviando}
        enviarClase={g.enviarClase}
        periodo={g.periodo}
        docentes={[...g.docentesPorId.values()]}
        grados={g.grados}
        seccionesParaSelect={g.seccionesParaClase}
        cargarSeccionesParaGrado={g.cargarSeccionesParaClase}
      />
    </>
  )
}
