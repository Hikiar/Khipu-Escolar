import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Header } from '@/components/layout/Header'
import { RecordatorioCambioContrasena } from '@/components/layout/RecordatorioCambioContrasena'
import { IndicadorAnioLectivo } from '@/components/layout/IndicadorAnioLectivo'
import { ToastProvider } from '@/components/ui/toast-provider'

const SIDEBAR_STATE_KEY = 'sidebar.state'

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
          <div className="mx-auto w-full max-w-6xl flex-1">
            <Outlet />
          </div>
        </main>
        <ToastProvider />
      </SidebarInset>
    </SidebarProvider>
  )
}