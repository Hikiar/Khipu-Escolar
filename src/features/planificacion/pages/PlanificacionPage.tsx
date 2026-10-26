import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common'
import { Layers, BookOpen } from 'lucide-react'
import { usePlanificacion } from '../hooks/usePlanificacion'
import { SeccionesTab, type GuardiaSecciones } from '@/features/planificacion/components/SeccionesTab'
import { PlanEstudiosTab } from '@/features/planificacion/components/PlanEstudiosTab'
import { GuardiaCambiosDialog } from '@/features/planificacion/components/secciones/GuardiaCambiosDialog'

type TabValue = 'secciones' | 'plan'

function normalizarTab(valor: string | null): TabValue {
  if (valor === 'plan') return 'plan'
  return 'secciones'
}

export function PlanificacionPage() {
  const { periodoEstado, gradosEstado, error, recargarTodo } = usePlanificacion()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabInicial = normalizarTab(searchParams.get('tab'))
  const [activeTab, setActiveTab] = useState<TabValue>(tabInicial)
  const [tabPendiente, setTabPendiente] = useState<TabValue | null>(null)
  const [guardandoTab, setGuardandoTab] = useState(false)
  const guardiaRef = useRef<GuardiaSecciones | null>(null)

  // Sync tab con URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', activeTab)
    setSearchParams(params)
  }, [activeTab, searchParams, setSearchParams])

  const pedirTab = (nuevo: TabValue) => {
    if (nuevo === activeTab) return
    if (activeTab === 'secciones' && guardiaRef.current?.sucio) {
      setTabPendiente(nuevo)
      return
    }
    setActiveTab(nuevo)
  }

  const cargandoInicial = periodoEstado === 'cargando' || gradosEstado === 'cargando'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Planificación Académica"
        description="Grados, secciones, clases, asignaturas y plan de estudios"
        icon={<Layers className="size-5" />}
        actions={
          <button
            onClick={() => void recargarTodo()}
            disabled={cargandoInicial}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Recargar todo
          </button>
        }
      />

      {error && (
        <ErrorState
          message={error ?? 'No se pudo cargar la planificación.'}
          onRetry={() => void recargarTodo()}
        />
      )}

      <Tabs value={activeTab} onValueChange={(valor) => pedirTab(valor as TabValue)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="secciones">
            <Layers className="size-4 mr-2" aria-hidden />
            Secciones
          </TabsTrigger>
          <TabsTrigger value="plan">
            <BookOpen className="size-4 mr-2" aria-hidden />
            Plan de estudios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="secciones">
          <SeccionesTab guardiaRef={guardiaRef} />
        </TabsContent>

        <TabsContent value="plan">
          <PlanEstudiosTab />
        </TabsContent>
      </Tabs>

      <GuardiaCambiosDialog
        abierto={tabPendiente !== null}
        guardando={guardandoTab}
        onDescartar={() => {
          guardiaRef.current?.descartar()
          if (tabPendiente) setActiveTab(tabPendiente)
          setTabPendiente(null)
        }}
        onGuardar={() => {
          void (async () => {
            setGuardandoTab(true)
            const ok = await guardiaRef.current?.guardar()
            setGuardandoTab(false)
            if (ok && tabPendiente) {
              setActiveTab(tabPendiente)
              setTabPendiente(null)
            }
          })()
        }}
        onSeguirEditando={() => setTabPendiente(null)}
      />
    </div>
  )
}
