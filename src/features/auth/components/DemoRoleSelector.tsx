import { Button } from '@/components/ui/button'
import { ROLES_INICIALES } from '@/config/roles'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useState } from 'react'
import { LoaderCircle, FlaskConical } from 'lucide-react'

/**
 * Acceso rápido por rol SOLO durante el desarrollo.
 * `import.meta.env.DEV` excluye este componente del bundle de producción.
 */
export function DemoRoleSelector() {
  const { loginDemo } = useAuth()
  const [rolActivo, setRolActivo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!import.meta.env.DEV) return null

  async function entrarComo(rolId: string) {
    setRolActivo(rolId)
    setError(null)
    const resultado = await loginDemo(rolId)
    if (!resultado.ok) setError('No se pudo entrar con este rol de prueba.')
    setRolActivo(null)
  }

  return (
    <section aria-label="Acceso rápido de desarrollo" className="grid gap-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <FlaskConical className="size-3.5" aria-hidden />
        Modo desarrollo — entrar por rol
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ROLES_INICIALES.map((rol) => (
          <Button
            key={rol.id}
            type="button"
            variant="outline"
            size="sm"
            className="justify-start"
            disabled={rolActivo !== null}
            onClick={() => entrarComo(rol.id)}
          >
            {rolActivo === rol.id && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            )}
            {rol.nombre}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}