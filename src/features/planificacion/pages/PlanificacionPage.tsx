import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common'
import { Layers, BookOpen, Users, UserCheck } from 'lucide-react'
import { usePlanificacion } from '../hooks/usePlanificacion'
import { GradosTab } from '@/features/planificacion/components/GradosTab'
import { PlanEstudiosTab } from '@/features/planificacion/components/PlanEstudiosTab'
import { ClasesTab } from '@/features/planificacion/components/ClasesTab'
import { AsignacionesTab } from '@/features/planificacion/components/AsignacionesTab'

type TabValue = 'grados' | 'plan' | 'clases' | 'asignaciones'

export function PlanificacionPage() {
  const { periodoEstado, gradosEstado, error, recargarTodo } = usePlanificacion()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabInicial = (searchParams.get('tab') as TabValue) || 'grados'
  const [activeTab, setActiveTab] = useState<TabValue>(tabInicial)

  // Sync tab con URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', activeTab)
    setSearchParams(params)
  }, [activeTab, searchParams, setSearchParams])

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grados">
            <Layers className="size-4 mr-2" aria-hidden />
            Grados y Secciones
          </TabsTrigger>
          <TabsTrigger value="plan">
            <BookOpen className="size-4 mr-2" aria-hidden />
            Plan de estudios
          </TabsTrigger>
          <TabsTrigger value="clases">
            <Users className="size-4 mr-2" aria-hidden />
            Clases
          </TabsTrigger>
          <TabsTrigger value="asignaciones">
            <UserCheck className="size-4 mr-2" aria-hidden />
            Asignaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grados">
          <GradosTab />
        </TabsContent>

        <TabsContent value="plan">
          <PlanEstudiosTab />
        </TabsContent>

        <TabsContent value="clases">
          <ClasesTab />
        </TabsContent>

        <TabsContent value="asignaciones">
          <AsignacionesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}