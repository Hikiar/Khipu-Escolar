import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export function ForbiddenPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" aria-hidden />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">403 — Acceso denegado</h1>
      <p className="max-w-md text-muted-foreground">
        No tienes los permisos necesarios para ver esta sección. Si crees que es
        un error, contacta con la dirección del centro.
      </p>
      <Button render={<Link to="/dashboard" />}>
        Volver al inicio
      </Button>
    </main>
  )
}