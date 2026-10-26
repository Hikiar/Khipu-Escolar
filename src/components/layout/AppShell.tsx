import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cn } from 'cn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Header } from '@/components/layout/Header'
import { RecordatorioCambioContrasena } from '@/components/layout/RecordatorioCambioContrasena'
import { IndicadorAnioLectivo } from '@/components/layout/IndicadorAnioLectivo'
import { ToastProvider } from '@/components/ui/toast-provider'

const SIDEBAR_STATE_KEY = 'sidebar.state'

/**
 * Páginas con tablas, listados, tarjetas o dashboards, que aprovechan mejor un
 * contenedor más ancho. El resto (formularios y fichas) conserva un ancho
 * cómodo para evitar líneas de texto demasiado largas.
 */
const RUTAS_ANCHO_AMPLIO = new Set([
  '/dashboard',
  '/alumnos',
  '/profesores',
  '/planificacion',
  '/matriculas',
  '/asistencia',
  '/calificaciones',
  '/pagos',
  '/conceptos-pago',
  '/reportes',
  '/usuarios',
  '/roles',
  '/modelos',
  '/auditoria',
  '/mis-salones',
])

function leerEstadoSidebar(): boolean {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY)
    return raw === null ? true : raw === 'expanded'
  } catch {
    return true
  }
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(leerEstadoSidebar)
  const { pathname } = useLocation()
  const anchoAmplio = RUTAS_ANCHO_AMPLIO.has(pathname)

  const cambiarSidebar = useCallback((abierto: boolean) => {
    setSidebarOpen(abierto)
    try {
      window.localStorage.setItem(
        SIDEBAR_STATE_KEY,
        abierto ? 'expanded' : 'collapsed',
      )
    } catch {
      // almacenamiento no disponible; la UI sigue funcionando
    }
  }, [])

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={cambiarSidebar}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:px-6">
          <IndicadorAnioLectivo />
          <RecordatorioCambioContrasena />
          <div
            className={cn(
              'mx-auto w-full flex-1',
              anchoAmplio ? 'max-w-[96rem]' : 'max-w-6xl',
            )}
          >
            <Outlet />
          </div>
        </main>
        <ToastProvider />
      </SidebarInset>
    </SidebarProvider>
  )
}