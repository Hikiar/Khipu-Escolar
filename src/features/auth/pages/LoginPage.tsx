import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { portalInfo } from '@/config/navigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { DemoRoleSelector } from '@/features/auth/components/DemoRoleSelector'
import { Navigate } from 'react-router-dom'
import { CheckCircle2, TimerReset } from 'lucide-react'

const beneficios = [
  'Multi-escuela: administra varias instituciones',
  'Matrículas y cupos por clase',
  'Asistencia, calificaciones y pagos centralizados',
]

export function LoginPage() {
  const { motivoCierre, usuario } = useAuth()

  if (usuario) return <Navigate to="/dashboard" replace />

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.3fr_1fr]">
      <section className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-muted/40 p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center [mask-image:linear-gradient(to_right,black_0%,black_62%,transparent_100%)]"
          style={{ backgroundImage: "url(/login-banner.webp)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/logo-horizontal.svg"
            alt={portalInfo.name}
            className="h-16 w-auto rounded-md"
          />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-medium tracking-wider text-primary-foreground/70 uppercase">
            Plataforma de gestión educativa
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            Todas tus clases, una sola plataforma.
          </h1>
          <p className="mt-3 text-primary-foreground/80">
            Matrículas, plazas docentes, asistencia, calificaciones y pagos de todas tus escuelas,
            centralizados en un solo lugar.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {beneficios.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 text-xs text-primary-foreground/60">
          <p>© {new Date().getFullYear()} {portalInfo.name}</p>
          <p>{portalInfo.tagline}</p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-muted/40 px-4 py-10 lg:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <img
              src="/logo-horizontal.svg"
              alt={portalInfo.name}
              className="h-12 w-auto rounded-md"
            />
          </div>

          {motivoCierre === 'expirada' && (
            <Alert className="mb-4">
              <TimerReset className="size-4" aria-hidden />
              <AlertTitle>Sesión expirada</AlertTitle>
              <AlertDescription>
                Tu sesión caducó por seguridad. Inicia sesión nuevamente.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Iniciar sesión</CardTitle>
              <CardDescription>
                Ingresa con tu DNI y contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <LoginForm />

              {import.meta.env.DEV && (
                <>
                  <Separator />
                  <DemoRoleSelector />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}