import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { AlumnosPage } from '@/features/alumnos/pages/AlumnosPage'
import { AlumnoFichaPage } from '@/features/alumnos/pages/AlumnoFichaPage'
import { ProfesoresPage } from '@/features/profesores/pages/ProfesoresPage'
import { ProfesorFichaPage } from '@/features/profesores/pages/ProfesorFichaPage'
import { MiPerfilPage } from '@/features/perfil/pages/MiPerfilPage'
import { MisSalonesPage } from '@/features/mis-salones/pages/MisSalonesPage'
import { PlanificacionPage } from '@/features/planificacion/pages/PlanificacionPage'
import { MatriculasPage } from '@/features/matriculas/pages/MatriculasPage'
import { AsistenciaPage } from '@/features/asistencia/pages/AsistenciaPage'
import { CalificacionesPage } from '@/features/calificaciones/pages/CalificacionesPage'
import { PagosPage } from '@/features/pagos/pages/PagosPage'
import { ConceptosPagoPage } from '@/features/pagos/pages/ConceptosPagoPage'
import { ReportesPage } from '@/features/reportes/pages/ReportesPage'
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage'
import { RolesPage } from '@/features/roles/pages/RolesPage'
import { ModelosPage } from '@/features/admin/pages/ModelosPage'
import { PeriodosPage } from '@/features/periodos/pages/PeriodosPage'
import { AuditoriaPage } from '@/features/auditoria/pages/AuditoriaPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForbiddenPage } from '@/features/auth/pages/ForbiddenPage'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { PermissionRoute } from '@/components/guards/PermissionRoute'
import { PERMISO_TOTAL } from '@/types/rbac'

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">La página que buscas no existe.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Área autenticada: toda ruta bajo AppShell exige sesión. */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="perfil" element={<MiPerfilPage />} />
          <Route
            path="mis-salones"
            element={
              <PermissionRoute permission="salones.mis">
                <MisSalonesPage />
              </PermissionRoute>
            }
          />
          <Route path="profesores/:id" element={
            <PermissionRoute permission="profesores.ver">
              <ProfesorFichaPage />
            </PermissionRoute>
          } />
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="alumnos"
            element={
              <PermissionRoute permission="alumnos.verTodos">
                <AlumnosPage />
              </PermissionRoute>
            }
          />
          <Route
            path="alumnos/:id"
            element={
              <PermissionRoute permission="alumnos.ver">
                <AlumnoFichaPage />
              </PermissionRoute>
            }
          />
          <Route
            path="profesores"
            element={
              <PermissionRoute permission="profesores.ver">
                <ProfesoresPage />
              </PermissionRoute>
            }
          />
          <Route
            path="planificacion"
            element={
              <PermissionRoute permission="grados.ver">
                <PlanificacionPage />
              </PermissionRoute>
            }
          />
          {/* Redirecciones de rutas antiguas hacia Planificación Académica */}
          <Route path="cursos" element={<Navigate to="/planificacion?tab=plan" replace />} />
          <Route path="grados" element={<Navigate to="/planificacion?tab=secciones" replace />} />
          <Route path="secciones" element={<Navigate to="/planificacion?tab=secciones" replace />} />
          <Route path="asignaciones" element={<Navigate to="/planificacion?tab=secciones" replace />} />
          <Route
            path="matriculas"
            element={
              <PermissionRoute permission="matriculas.ver">
                <MatriculasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="asistencia"
            element={
              <PermissionRoute permission="asistencia.ver">
                <AsistenciaPage />
              </PermissionRoute>
            }
          />
          <Route
            path="calificaciones"
            element={
              <PermissionRoute permission="notas.ver">
                <CalificacionesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="pagos"
            element={
              <PermissionRoute permission="pagos.ver">
                <PagosPage />
              </PermissionRoute>
            }
          />
          <Route
            path="conceptos-pago"
            element={
              <PermissionRoute permission="conceptosPago.ver">
                <ConceptosPagoPage />
              </PermissionRoute>
            }
          />
          <Route
            path="reportes"
            element={
              <PermissionRoute permission="reportes.ver">
                <ReportesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <PermissionRoute permission="usuarios.gestionar">
                <UsuariosPage />
              </PermissionRoute>
            }
          />
          <Route
            path="roles"
            element={
              <PermissionRoute permission="roles.gestionar">
                <RolesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="modelos"
            element={
              <PermissionRoute permission="modelos.ver">
                <ModelosPage />
              </PermissionRoute>
            }
          />
          <Route
            path="periodos"
            element={
              <PermissionRoute permission="periodos.ver">
                <PeriodosPage />
              </PermissionRoute>
            }
          />
          <Route
            path="auditoria"
            element={
              <PermissionRoute permission={PERMISO_TOTAL}>
                <AuditoriaPage />
              </PermissionRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}