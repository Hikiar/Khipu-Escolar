import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/common/PageHeader'
import { FichaCabecera } from '@/components/common/FichaCabecera'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cambiarContrasena } from '@/services/authService'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useModulosOcultos } from '@/hooks/useFilteredNav'
import { obtenerPermiso } from '@/config/permissions'
import { notificarExito, notificarError } from '@/lib/feedback'
import type { PermissionCode } from '@/types/rbac'
import { PERMISO_TOTAL } from '@/types/rbac'
import { KeyRound, Lock, LogOut, RefreshCcw, ShieldCheck, ShieldOff, UserRound } from 'lucide-react'

const contrasenaSchema = z
  .object({
    passwordActual: z.string().min(1, 'Ingresa tu contraseña actual.'),
    passwordNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
    confirmacion: z.string().min(1, 'Repite la nueva contraseña.'),
  })
  .refine((datos) => datos.passwordNueva === datos.confirmacion, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmacion'],
  })

function LineaDato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

function formatearFecha(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Agrupa los permisos efectivos por módulo (prefijo antes del punto). */
function agruparPermisos(
  permisos: PermissionCode[],
): { modulo: string; permisos: PermissionCode[] }[] {
  const mapa = new Map<string, PermissionCode[]>()
  for (const codigo of permisos) {
    if (codigo === PERMISO_TOTAL) continue
    const modulo = codigo.split('.')[0]
    const lista = mapa.get(modulo) ?? []
    lista.push(codigo)
    mapa.set(modulo, lista)
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([modulo, lista]) => ({
      modulo,
      permisos: [...lista].sort((a, b) => a.localeCompare(b)),
    }))
}

export function MiPerfilPage() {
  const { usuario, sesion, logout, refrescarSesion, refrescarPerfil } = useAuth()
  const persona = usuario?.persona
  const modulosOcultos = useModulosOcultos()

  const [enviando, setEnviando] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  const form = useFormValidation(contrasenaSchema, {
    defaultValues: { passwordActual: '', passwordNueva: '', confirmacion: '' },
  })

  const errores = form.formState.errors

  const permisosAgrupados = useMemo(
    () => agruparPermisos(usuario?.permisos ?? []),
    [usuario],
  )
  const esAccesoTotal = usuario?.permisos.includes(PERMISO_TOTAL) ?? false

  async function actualizarPerfil() {
    setActualizando(true)
    try {
      const res = await refrescarPerfil()
      if (res.ok === true) {
        notificarExito('Perfil actualizado', 'Tus permisos y datos se recargaron correctamente.')
      } else {
        notificarError(res.error)
      }
    } catch {
      notificarError('No se pudo refrescar el perfil. Intenta nuevamente.')
    } finally {
      setActualizando(false)
    }
  }

  async function onSubmit(datos: z.infer<typeof contrasenaSchema>) {
    setEnviando(true)
    setErrorGlobal(null)
    const resultado = await cambiarContrasena({
      passwordActual: datos.passwordActual,
      passwordNueva: datos.passwordNueva,
    })
    setEnviando(false)
    if (resultado.ok === false) {
      setErrorGlobal(resultado.error)
    } else {
      toast.success('Contraseña actualizada', {
        description: 'Tu nueva contraseña ya está activa. Úsala en tu próximo ingreso.',
      })
      form.reset()
      void refrescarSesion()
    }
  }

  if (!persona || !usuario) return null

  const iniciales = `${persona.nombres.trim().charAt(0)}${persona.apellidos.trim().charAt(0)}`.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mi perfil"
        description="Tus datos de cuenta, roles y contraseña"
        icon={<UserRound className="size-5" />}
      />

      <FichaCabecera
        iniciales={iniciales}
        nombre={`${persona.nombres} ${persona.apellidos}`}
        subtitulo={`DNI ${persona.dni} · usuario ${usuario.username}`}
        estado={{ label: 'Sesión activa', variante: 'success' }}
        badges={
          <>
            {usuario.roles.map((rol) => (
              <Badge key={rol.id} variant="secondary" size="sm">
                {rol.nombre}
              </Badge>
            ))}
          </>
        }
        actions={
          <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la cuenta</CardTitle>
            <CardDescription>Información registrada de tu persona y sesión.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <LineaDato label="Nombres" value={`${persona.nombres} ${persona.apellidos}`} />
              <LineaDato label="DNI" value={persona.dni} />
              <LineaDato label="Correo" value={persona.correo ?? '—'} />
              <LineaDato label="Teléfono" value={persona.telefono ?? '—'} />
              <LineaDato label="Usuario" value={usuario.username} />
              <LineaDato
                label="Roles"
                value={usuario.roles.map((rol) => rol.nombre).join(', ') || 'Sin rol'}
              />
            </dl>
            <Separator className="my-4" />
            <dl className="space-y-3">
              <LineaDato label="Sesión iniciada" value={formatearFecha(sesion?.createdAt)} />
              <LineaDato label="Expira" value={formatearFecha(sesion?.expiresAt)} />
              <LineaDato label="Estado" value={usuario.activo ? 'Activo' : 'Inactivo'} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cambiar contraseña</CardTitle>
            <CardDescription>
              La nueva contraseña debe tener al menos 8 caracteres y ser diferente a la actual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {errorGlobal && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {errorGlobal}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="password-actual">Contraseña actual</Label>
                <Input
                  id="password-actual"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register('passwordActual')}
                />
                {errores.passwordActual?.message && (
                  <p className="text-xs text-destructive">{errores.passwordActual.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-nueva">Nueva contraseña</Label>
                <Input
                  id="password-nueva"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('passwordNueva')}
                />
                {errores.passwordNueva?.message && (
                  <p className="text-xs text-destructive">{errores.passwordNueva.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-confirmacion">Repite la nueva contraseña</Label>
                <Input
                  id="password-confirmacion"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('confirmacion')}
                />
                {errores.confirmacion?.message && (
                  <p className="text-xs text-destructive">{errores.confirmacion.message}</p>
                )}
              </div>
              <Button type="submit" disabled={enviando}>
                <KeyRound className="size-4" aria-hidden />
                {enviando ? 'Guardando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" aria-hidden />
                Permisos efectivos
              </CardTitle>
              <CardDescription>
                Permisos que tu sesión tiene resueltos a partir de tus roles activos.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void actualizarPerfil()}
              disabled={actualizando}
              aria-label="Actualizar permisos y datos del perfil"
            >
              <RefreshCcw className={`size-3.5 ${actualizando ? 'animate-spin' : ''}`} aria-hidden />
              {actualizando ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {esAccesoTotal ? (
            <div className="flex flex-col gap-1.5">
              <Badge className="w-fit">
                <ShieldCheck className="size-3" aria-hidden />
                Acceso total
              </Badge>
              <p className="text-sm text-muted-foreground">
                Tu rol incluye todos los permisos del sistema.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {usuario.permisos.length} permiso{usuario.permisos.length !== 1 ? 's' : ''} en{' '}
                {permisosAgrupados.length} módulo{permisosAgrupados.length !== 1 ? 's' : ''}.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {permisosAgrupados.map(({ modulo, permisos }) => (
                  <section key={modulo} aria-label={`Permisos del módulo ${modulo}`}>
                    <h3 className="mb-2 text-sm font-semibold capitalize">{modulo}</h3>
                    <ul className="space-y-1.5" role="list">
                      {permisos.map((codigo) => (
                        <li key={codigo} className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5 shrink-0 font-mono text-[10px]">
                            {codigo}
                          </Badge>
                          <span className="text-xs leading-5 text-muted-foreground">
                            {obtenerPermiso(codigo)?.descripcion ?? codigo}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card id="modulos-no-disponibles">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldOff className="size-4" aria-hidden />
            Módulos no disponibles
          </CardTitle>
          <CardDescription>
            Módulos que no aparecen en el menú lateral y el motivo concreto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modulosOcultos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tienes acceso a todos los módulos del menú.
            </p>
          ) : (
            <div className="space-y-5">
              {modulosOcultos
                .reduce<{ group: string; items: typeof modulosOcultos }[]>((grupos, oculto) => {
                  const existente = grupos.find((g) => g.group === oculto.group)
                  if (existente) existente.items.push(oculto)
                  else grupos.push({ group: oculto.group, items: [oculto] })
                  return grupos
                }, [])
                .map(({ group, items }) => (
                  <section key={group} aria-label={`Módulos ocultos del grupo ${group}`}>
                    <h3 className="mb-2 text-sm font-semibold">{group}</h3>
                    <ul className="space-y-3" role="list">
                      {items.map(({ item, motivo }) => (
                        <li key={item.href} className="rounded-md border p-3">
                          <div className="flex items-center gap-2">
                            <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          <p className="mt-1 text-xs text-warning">{motivo}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              <p className="text-xs text-muted-foreground">
                Estos módulos no aparecen en el menú lateral por los motivos indicados. Si
                necesitas acceso, contacta con dirección.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}