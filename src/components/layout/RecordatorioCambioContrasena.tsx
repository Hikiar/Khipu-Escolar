import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, X } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'

const CLAVE_DISMISS = 'csm.recordatorio.clave'

/**
 * Recordatorio amable de cambio de contraseña (alta/reset/restablecimiento).
 * Dismissible por sesión del navegador: reaparece al abrir una nueva pestaña
 * o tras un nuevo ingreso hasta que la contraseña se cambie realmente.
 */
export function RecordatorioCambioContrasena() {
  const { usuario } = useAuth()
  const [oculto, setOculto] = useState(() => {
    try {
      return sessionStorage.getItem(CLAVE_DISMISS) === '1'
    } catch {
      return false
    }
  })

  const visible = Boolean(usuario?.debeCambiarPassword) && !oculto

  function ocultar() {
    setOculto(true)
    try {
      sessionStorage.setItem(CLAVE_DISMISS, '1')
    } catch {
      // sin almacenamiento: el recordatorio reaparecerá; es lo correcto
    }
  }

  if (!visible) return null

  return (
    <div className="flex w-full items-start justify-between gap-3 rounded-lg border border-[var(--warning)]/30 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-3.5 py-2.5 text-sm text-foreground">
      <div className="flex items-start gap-2.5">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-balance">
          <span className="font-medium">Tu contraseña es temporal.</span>{' '}
          Debes cambiarla para seguir usando el sistema con seguridad.
          <Link to="/perfil" className="ml-1 font-medium text-[var(--warning)] underline underline-offset-2 hover:text-foreground">
            Cambiarla ahora
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={ocultar}
        aria-label="Ocultar recordatorio"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}