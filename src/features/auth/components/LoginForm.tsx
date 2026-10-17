import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CodigoErrorAuth, CredencialesLogin } from '@/types/auth'
import { AlertCircle, LoaderCircle } from 'lucide-react'

const MENSAJES_ERROR: Record<CodigoErrorAuth, string> = {
  INVALID_CREDENTIALS: 'El código institucional o la contraseña son incorrectos.',
  USER_INACTIVE: 'Esta cuenta está inactiva. Contacta con administración.',
  SESSION_EXPIRED: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  SERVER_ERROR: 'Ocurrió un error al autenticar. Inténtalo de nuevo.',
}

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname

  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<CodigoErrorAuth | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!codigo.trim() || !password) return

    setEnviando(true)
    setError(null)

    const credenciales: CredencialesLogin = { codigo: codigo.trim(), password }
    const resultado = await login(credenciales)

    if (resultado.ok === true) {
      navigate(from ?? '/dashboard', { replace: true })
    } else {
      setError(resultado.error)
    }
    setEnviando(false)
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error && (
        <Alert
          id="login-error"
          variant="destructive"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle>No se pudo iniciar sesión</AlertTitle>
          <AlertDescription>{MENSAJES_ERROR[error]}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="login-codigo">Código institucional</Label>
        <Input
          id="login-codigo"
          name="codigo"
          type="text"
          autoComplete="username"
          placeholder="D26000001"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          aria-invalid={error === 'INVALID_CREDENTIALS'}
          aria-describedby={error ? 'login-error' : undefined}
          required
        />
        <p className="text-xs text-muted-foreground">
          Usa el código que te entregó la dirección (ej. D26000001).
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error === 'INVALID_CREDENTIALS'}
          aria-describedby={error ? 'login-error' : undefined}
          required
        />
      </div>

      <Button type="submit" disabled={enviando || !codigo.trim() || !password}>
        {enviando && (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        )}
        {enviando ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}