import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type {
  AuthContextValue,
  AuthUser,
  CredencialesLogin,
  EstadoSesion,
  MotivoCierre,
  ResultadoAutenticacion,
  Sesion,
} from '@/types/auth'
import type { ResultadoServicio } from '@/types/operations'
import type { PermissionCode } from '@/types/rbac'
import {
  iniciarSesion,
  iniciarSesionDemo,
  validarSesion,
  cerrarSesion,
  obtenerUsuarioActual,
} from '@/services/authService'
import { guardarSesion, leerSesion, limpiarSesion } from '@/lib/session-store'
import { hasPermission, hasRoleUnico } from '@/lib/authorization'

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Única instancia global del contexto de autenticación.
 * Se monta UNA sola vez en `main.tsx`; no debe envolverse `App` con otro
 * <AuthProvider> para no duplicar el estado de sesión.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion)
  const [estado, setEstado] = useState<EstadoSesion>(() =>
    leerSesion() ? 'restaurando' : 'anonimo',
  )
  const [motivoCierre, setMotivoCierre] = useState<MotivoCierre>(null)

  const usuario: AuthUser | null = sesion?.usuario ?? null

  // Restauración de sesión persistida (se valida de forma asíncrona contra el servicio).
  useEffect(() => {
    const stored = leerSesion()
    if (!stored) return

    validarSesion(stored).then((res) => {
      if (res.ok === true) {
        guardarSesion(res.sesion)
        setSesion(res.sesion)
        setEstado('autenticado')
      } else {
        limpiarSesion()
        setMotivoCierre(res.error === 'SESSION_EXPIRED' ? 'expirada' : null)
        setEstado('anonimo')
      }
    })
  }, [])

  const login = useCallback(
    async (credenciales: CredencialesLogin): Promise<ResultadoAutenticacion> => {
      const res = await iniciarSesion(credenciales)
      if (res.ok === true) {
        guardarSesion(res.sesion)
        setSesion(res.sesion)
        setMotivoCierre(null)
        setEstado('autenticado')
      }
      return res
    },
    [],
  )

  const loginDemo = useCallback(
    async (rolId: string): Promise<ResultadoAutenticacion> => {
      // Selector estrictamente de desarrollo: jamás disponible en producción.
      if (!import.meta.env.DEV) {
        return { ok: false, error: 'SERVER_ERROR' }
      }
      const res = await iniciarSesionDemo(rolId)
      if (res.ok === true) {
        guardarSesion(res.sesion)
        setSesion(res.sesion)
        setMotivoCierre(null)
        setEstado('autenticado')
      }
      return res
    },
    [],
  )

  const logout = useCallback(() => {
    void cerrarSesion(sesion?.token ?? '')
    limpiarSesion()
    setSesion(null)
    setMotivoCierre('logout')
    setEstado('anonimo')
  }, [sesion])

  /** Revalida la sesión contra la API (usado tras cambiar la contraseña, para limpiar el flag en el perfil). */
  const refrescarSesion = useCallback(async () => {
    if (!sesion) return
    const res = await validarSesion(sesion)
    if (res.ok === true) {
      guardarSesion(res.sesion)
      setSesion(res.sesion)
      setEstado('autenticado')
    }
  }, [sesion])

  /**
   * Re-descarga el usuario vía `GET /auth/me` y actualiza la sesión en
   * memoria/almacén sin revalidar el token. Devuelve el resultado para que
   * el consumidor pueda distinguir éxito de fallo (feedback honesto).
   */
  const refrescarPerfil = useCallback(async (): Promise<ResultadoServicio<AuthUser>> => {
    const res = await obtenerUsuarioActual()
    if (res.ok === true && sesion) {
      const actualizada: Sesion = { ...sesion, usuario: res.data }
      guardarSesion(actualizada)
      setSesion(actualizada)
    }
    return res
  }, [sesion])

  const forzarExpiracionDemo = useCallback(() => {
    void cerrarSesion(sesion?.token ?? '')
    limpiarSesion()
    setSesion(null)
    setMotivoCierre('expirada')
    setEstado('anonimo')
  }, [sesion])

  const can = useCallback(
    (permiso?: PermissionCode): boolean =>
      hasPermission(usuario?.permisos ?? [], permiso),
    [usuario],
  )

  const hasRole = useCallback(
    (rolId: string): boolean => hasRoleUnico(usuario?.rolIds ?? [], rolId),
    [usuario],
  )

  return (
    <AuthContext.Provider
      value={{
        estado,
        sesion,
        usuario,
        motivoCierre,
        login,
        loginDemo,
        logout,
        refrescarSesion,
        refrescarPerfil,
        forzarExpiracionDemo,
        can,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }