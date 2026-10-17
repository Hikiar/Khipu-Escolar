import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import type { Rol } from '@/types/rbac'
import {
  crearUsuario,
  listarUsuarios,
  desactivarUsuario,
  reactivarUsuario,
  restablecerContrasena,
  buscarPersonaParaCuenta,
  verPasswordTemporal,
  type PersonaParaCuenta,
  type UsuarioConPersona,
  type UsuarioCreado,
} from '@/services/usuariosService'
import { listarRoles } from '@/services/rolesService'
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  KeyRound,
  Plus,
  RefreshCcw,
  RotateCcw,
  UserCog,
  UserX,
} from 'lucide-react'
import { Can } from '@/components/guards/Can'


/** Roles que pueden tener cuenta de acceso (todos los del sistema con letra de código). */
const ROL_CODIGOS_CON_CUENTA = ['director', 'profesor', 'secretaria', 'personal']


export function UsuariosPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [usuarios, setUsuarios] = useState<UsuarioConPersona[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const [usuariosRes, rolesRes] = await Promise.all([
      listarUsuarios(),
      listarRoles(),
    ])
    if (usuariosRes.ok && rolesRes.ok) {
      setUsuarios(usuariosRes.data)
      setRoles(rolesRes.data)
      setEstado('ok')
    } else {
      setError('No se pudo cargar la lista de usuarios.')
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargar()
  }

  const [dialogoRegistrar, setDialogoRegistrar] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [registrarError, setRegistrarError] = useState<string | null>(null)
  const [creado, setCreado] = useState<UsuarioCreado | null>(null)
  const [copiado, setCopiado] = useState<'codigo' | 'password' | null>(null)

  const [formDni, setFormDni] = useState('')
  const [formNombres, setFormNombres] = useState('')
  const [formApellidos, setFormApellidos] = useState('')
  const [formCorreo, setFormCorreo] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formRolId, setFormRolId] = useState('')
  /** Si la persona ya existe, sus nombres se autocompletan y quedan fijos. */
  const [personaFijada, setPersonaFijada] = useState(false)

  const rolesConCuenta = roles.filter((rol) =>
    ROL_CODIGOS_CON_CUENTA.includes(rol.codigo),
  )

  function abrirDialogoRegistrar() {
    setFormDni('')
    setFormNombres('')
    setFormApellidos('')
    setFormCorreo('')
    setFormTelefono('')
    setFormRolId(rolesConCuenta[0]?.id ?? '')
    setRegistrarError(null)
    setCreado(null)
    setBusquedaPersona(null)
    setPersonaFijada(false)
    setDialogoRegistrar(true)
  }

  async function ejecutarRegistrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formRolId) {
      setRegistrarError('Debe seleccionar un rol.')
      return
    }
    setRegistrando(true)
    setRegistrarError(null)

    const resultado = await crearUsuario({
      dni: formDni.trim(),
      nombres: formNombres.trim(),
      apellidos: formApellidos.trim(),
      correo: formCorreo.trim() || undefined,
      telefono: formTelefono.trim() || undefined,
      rolIds: [formRolId],
    })

    setRegistrando(false)

    if (resultado.ok === false) {
      setRegistrarError(resultado.error)
      return
    }
    setCreado(resultado.data)
    void cargar()
  }

  async function copiar(texto: string, tipo: 'codigo' | 'password') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(tipo)
      window.setTimeout(() => setCopiado(null), 1500)
    } catch {
      setCopiado(null)
    }
  }

  const [dialogoDesactivar, setDialogoDesactivar] = useState<UsuarioConPersona | null>(null)
  const [desactivando, setDesactivando] = useState(false)
  const [desactivarError, setDesactivarError] = useState<string | null>(null)

  const [dialogoReactivar, setDialogoReactivar] = useState<UsuarioConPersona | null>(null)
  const [reactivando, setReactivando] = useState(false)
  const [reactivarError, setReactivarError] = useState<string | null>(null)

  const [busquedaPersona, setBusquedaPersona] = useState<PersonaParaCuenta | null | 'buscando'>(null)

  async function buscarPersonaPorDni(dni: string) {
    const limpio = dni.trim()
    if (limpio.length < 8) {
      setBusquedaPersona(null)
      setPersonaFijada(false)
      return
    }
    setBusquedaPersona('buscando')
    const res = await buscarPersonaParaCuenta(limpio)
    const encontrada = res.ok === true ? res.data : null
    setBusquedaPersona(encontrada)
    if (encontrada && !encontrada.tieneCuenta) {
      // P1: la persona existe → autocompletar sus datos (no re-teclearlos).
      setFormNombres(encontrada.persona.nombres)
      setFormApellidos(encontrada.persona.apellidos)
      setPersonaFijada(true)
    } else {
      setPersonaFijada(false)
    }
  }

  const [dialogoRestablecer, setDialogoRestablecer] = useState<UsuarioConPersona | null>(null)
  const [restableciendo, setRestableciendo] = useState(false)
  const [restablecerError, setRestablecerError] = useState<string | null>(null)
  const [restablecida, setRestablecida] = useState<{
    usuario: UsuarioConPersona
    passwordGenerada: string
  } | null>(null)
  const [copiadoRestablecida, setCopiadoRestablecida] = useState(false)

  const [verClave, setVerClave] = useState<
    | { estado: 'cargando' }
    | { estado: 'ok'; usuario: UsuarioConPersona; passwordTemporal: string }
    | { estado: 'error'; mensaje: string }
    | null
  >(null)
  const [copiadoVerClave, setCopiadoVerClave] = useState(false)

  async function abrirVerClave(usuario: UsuarioConPersona) {
    setVerClave({ estado: 'cargando' })
    const resultado = await verPasswordTemporal(usuario.id)
    if (resultado.ok === true) {
      setVerClave({
        estado: 'ok',
        usuario,
        passwordTemporal: resultado.data.passwordTemporal,
      })
    } else {
      setVerClave({ estado: 'error', mensaje: resultado.error })
    }
  }

  async function copiarVerClave() {
    if (verClave?.estado !== 'ok') return
    try {
      await navigator.clipboard.writeText(verClave.passwordTemporal)
      setCopiadoVerClave(true)
      window.setTimeout(() => setCopiadoVerClave(false), 1500)
    } catch {
      setCopiadoVerClave(false)
    }
  }

  function abrirRestablecer(usuario: UsuarioConPersona) {
    setDialogoRestablecer(usuario)
    setRestablecerError(null)
  }

  async function ejecutarRestablecer() {
    if (!dialogoRestablecer) return
    setRestableciendo(true)
    setRestablecerError(null)

    const resultado = await restablecerContrasena(dialogoRestablecer.id)

    setRestableciendo(false)

    if (resultado.ok === false) {
      setRestablecerError(resultado.error)
      return
    }
    setRestablecida({
      usuario: dialogoRestablecer,
      passwordGenerada: resultado.data.passwordGenerada,
    })
    setDialogoRestablecer(null)
    void cargar()
  }

  async function copiarRestablecida() {
    if (!restablecida) return
    try {
      await navigator.clipboard.writeText(restablecida.passwordGenerada)
      setCopiadoRestablecida(true)
      window.setTimeout(() => setCopiadoRestablecida(false), 1500)
    } catch {
      setCopiadoRestablecida(false)
    }
  }

  function abrirConfirmarDesactivar(usuario: UsuarioConPersona) {
    setDialogoDesactivar(usuario)
    setDesactivarError(null)
  }

  async function ejecutarDesactivar() {
    if (!dialogoDesactivar) return
    setDesactivando(true)
    setDesactivarError(null)

    const resultado = await desactivarUsuario(dialogoDesactivar.id)

    setDesactivando(false)

    if (resultado.ok === false) {
      setDesactivarError(resultado.error)
      return
    }
    setDialogoDesactivar(null)
    void cargar()
  }

  function abrirConfirmarReactivar(usuario: UsuarioConPersona) {
    setDialogoReactivar(usuario)
    setReactivarError(null)
  }

  async function ejecutarReactivar() {
    if (!dialogoReactivar) return
    setReactivando(true)
    setReactivarError(null)

    const resultado = await reactivarUsuario(dialogoReactivar.id)

    setReactivando(false)

    if (resultado.ok === false) {
      setReactivarError(resultado.error)
      return
    }
    setDialogoReactivar(null)
    void cargar()
  }

  const nombreDeRoles = (rolIds: string[]) =>
    roles.filter((rol) => rolIds.includes(rol.id))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso al sistema. El usuario es el código institucional."
        icon={<UserCog />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Alert className="flex-1 basis-72">
          <AlertTitle>Gestión de cuentas</AlertTitle>
          <AlertDescription>
            Registre una cuenta para el director, secretaría, profesores o
            personal. El sistema genera el código institucional y una contraseña
            provisional que podrá copiar y compartir con la persona.
          </AlertDescription>
        </Alert>
        <Can permission="usuarios.gestionar">
          <Button onClick={abrirDialogoRegistrar}>
            <Plus className="size-4" aria-hidden />
            Registrar usuario
          </Button>
        </Can>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuentas de usuario</CardTitle>
          <CardDescription>
            {estado === 'ok' && usuarios.length > 0
              ? `${usuarios.length} cuentas registradas`
              : 'Listado de cuentas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estado === 'error' && (
            <div className="grid gap-3">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>Error al cargar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div>
                <Button variant="outline" onClick={reintentar}>
                  <RefreshCcw className="size-4" aria-hidden />
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {estado === 'cargando' && (
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton />
              </TableBody>
            </Table>
          )}

          {estado === 'ok' && usuarios.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay usuarios registrados.
            </p>
          )}

          {estado === 'ok' && usuarios.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium tabular-nums">
                      {usuario.username}
                    </TableCell>
                    <TableCell>
                      {usuario.persona
                        ? `${usuario.persona.nombres} ${usuario.persona.apellidos}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {nombreDeRoles(usuario.rolIds).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {nombreDeRoles(usuario.rolIds).map((rol) => (
                            <Badge key={rol.id} variant="secondary">
                              {rol.nombre}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sin rol</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={usuario.activo ? 'success' : 'outline'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {usuario.debeCambiarPassword && (
                          <Badge variant="warning">Cambiar clave</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {usuario.activo && usuario.debeCambiarPassword && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => void abrirVerClave(usuario)}
                          >
                            <Eye className="size-3" aria-hidden />
                            Ver clave temporal
                          </Button>
                        )}
                        {usuario.activo && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => abrirRestablecer(usuario)}
                          >
                            <KeyRound className="size-3" aria-hidden />
                            Restablecer
                          </Button>
                        )}
                        {usuario.activo && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => abrirConfirmarDesactivar(usuario)}
                          >
                            <UserX className="size-3" aria-hidden />
                            Dar de baja
                          </Button>
                        )}
                        {!usuario.activo && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => abrirConfirmarReactivar(usuario)}
                          >
                            <RotateCcw className="size-3" aria-hidden />
                            Volver a activar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogoRegistrar}
        onOpenChange={(open) => {
          if (!open) setDialogoRegistrar(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar usuario</DialogTitle>
            <DialogDescription>
              Ingrese los datos de la persona y el rol. El código institucional
              y la contraseña se generan automáticamente.
            </DialogDescription>
          </DialogHeader>

          {registrarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{registrarError}</AlertDescription>
            </Alert>
          )}

          <form id="form-registrar-usuario" onSubmit={ejecutarRegistrar} className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="usr-dni">DNI</Label>
                <Input
                  id="usr-dni"
                  placeholder="12345678"
                  value={formDni}
                  onChange={(event) => {
                    setFormDni(event.target.value)
                    void buscarPersonaPorDni(event.target.value)
                  }}
                  required
                />
                {busquedaPersona === 'buscando' && (
                  <p className="text-xs text-muted-foreground">Buscando persona...</p>
                )}
                {busquedaPersona && busquedaPersona !== 'buscando' && (
                  <p className="text-xs text-amber-700 dark:text-amber-500">
                    Persona existente: <strong>{busquedaPersona.persona.nombres}{' '}{busquedaPersona.persona.apellidos}</strong>.
                    {busquedaPersona.tieneCuenta
                      ? ' Ya tiene una cuenta de acceso.'
                      : busquedaPersona.esDocente || busquedaPersona.esAlumno
                        ? ' Ya está registrada; se reutilizará su código institucional.'
                        : ' Se reutilizará su código institucional.'}
                  </p>
                )}
                {busquedaPersona && busquedaPersona !== 'buscando' && !busquedaPersona.tieneCuenta && !busquedaPersona.esDocente && (
                  <p className="text-xs font-medium text-violet-700 dark:text-violet-400" role="alert">
                    No figura en el registro de docentes: si elige el rol
                    Profesor, su ficha de docente se creará automáticamente.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usr-rol">Rol</Label>
                <Select value={formRolId || undefined} onValueChange={setFormRolId}>
                  <SelectTrigger id="usr-rol">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesConCuenta.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="usr-nombres">Nombres</Label>
              <Input
                id="usr-nombres"
                placeholder="Nombres de la persona"
                value={formNombres}
                onChange={(event) => setFormNombres(event.target.value)}
                readOnly={personaFijada}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="usr-apellidos">Apellidos</Label>
              <Input
                id="usr-apellidos"
                placeholder="Apellidos de la persona"
                value={formApellidos}
                onChange={(event) => setFormApellidos(event.target.value)}
                readOnly={personaFijada}
                required
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="usr-correo">Correo electrónico</Label>
                <Input
                  id="usr-correo"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formCorreo}
                  onChange={(event) => setFormCorreo(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usr-telefono">Teléfono</Label>
                <Input
                  id="usr-telefono"
                  placeholder="Número de teléfono"
                  maxLength={20}
                  value={formTelefono}
                  onChange={(event) => setFormTelefono(event.target.value)}
                />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoRegistrar(false)}
              disabled={registrando}
            >
              Cancelar
            </Button>
            <Button type="submit" form="form-registrar-usuario" disabled={registrando}>
              {registrando ? 'Registrando...' : 'Registrar cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={creado !== null}
        onOpenChange={(open) => {
          if (!open) setCreado(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="size-5 text-emerald-600" aria-hidden />
              Cuenta creada
            </DialogTitle>
            <DialogDescription>
              Comparta estos datos con la persona. La contraseña solo se muestra
              esta vez; pídale que la cambie al ingresar.
            </DialogDescription>
          </DialogHeader>

          {creado && (
            <div className="grid gap-3">
              <div className="grid gap-2 rounded-lg border p-3">
                <Label className="flex items-center gap-1.5 text-xs">
                  <KeyRound className="size-3.5" aria-hidden />
                  Código institucional (usuario)
                </Label>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {creado.username}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => void copiar(creado.username, 'codigo')}
                  >
                    {copiado === 'codigo' ? (
                      <Check className="size-3" aria-hidden />
                    ) : (
                      <Copy className="size-3" aria-hidden />
                    )}
                    {copiado === 'codigo' ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
              </div>

              {creado.passwordGenerada && (
                <div className="grid gap-2 rounded-lg border p-3">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <KeyRound className="size-3.5" aria-hidden />
                    Contraseña provisional
                  </Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-semibold">
                      {creado.passwordGenerada}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => void copiar(creado.passwordGenerada ?? '', 'password')}
                    >
                      {copiado === 'password' ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        <Copy className="size-3" aria-hidden />
                      )}
                      {copiado === 'password' ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreado(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoRestablecer !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoRestablecer(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Se generará una nueva contraseña para{' '}
              <strong>{dialogoRestablecer?.username}</strong>. Las sesiones activas
              del usuario se cerrarán y deberá cambiar la contraseña en su próximo
              ingreso.
            </DialogDescription>
          </DialogHeader>

          {restablecerError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{restablecerError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoRestablecer(null)}
              disabled={restableciendo}
            >
              Cancelar
            </Button>
            <Button onClick={ejecutarRestablecer} disabled={restableciendo}>
              {restableciendo ? 'Restableciendo...' : 'Restablecer contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={restablecida !== null}
        onOpenChange={(open) => {
          if (!open) setRestablecida(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="size-5 text-emerald-600" aria-hidden />
              Contraseña restablecida
            </DialogTitle>
            <DialogDescription>
              Comparta la nueva contraseña con la persona. Se le pedirá cambiarla
              en su próximo ingreso.
            </DialogDescription>
          </DialogHeader>

          {restablecida && (
            <div className="grid gap-3">
              <div className="grid gap-2 rounded-lg border p-3">
                <Label className="text-xs">Usuario</Label>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {restablecida.usuario.username}
                </span>
              </div>
              <div className="grid gap-2 rounded-lg border p-3">
                <Label className="flex items-center gap-1.5 text-xs">
                  <KeyRound className="size-3.5" aria-hidden />
                  Nueva contraseña
                </Label>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-semibold">
                    {restablecida.passwordGenerada}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => void copiarRestablecida()}
                  >
                    {copiadoRestablecida ? (
                      <Check className="size-3" aria-hidden />
                    ) : (
                      <Copy className="size-3" aria-hidden />
                    )}
                    {copiadoRestablecida ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setRestablecida(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={verClave !== null}
        onOpenChange={(open) => {
          if (!open) setVerClave(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-violet-600" aria-hidden />
              Contraseña temporal
            </DialogTitle>
            <DialogDescription>
              {verClave?.estado === 'ok'
                ? `Contraseña vigente de ${verClave.usuario.username}. Se borrará automáticamente cuando la persona cambie su clave.`
                : 'La contraseña temporal pendiente de cambio.'}
            </DialogDescription>
          </DialogHeader>

          {verClave?.estado === 'cargando' && (
            <p className="text-sm text-muted-foreground">Consultando...</p>
          )}

          {verClave?.estado === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>No disponible</AlertTitle>
              <AlertDescription>{verClave.mensaje}</AlertDescription>
            </Alert>
          )}

          {verClave?.estado === 'ok' && (
            <div className="grid gap-2 rounded-lg border p-3">
              <Label className="flex items-center gap-1.5 text-xs">
                <KeyRound className="size-3.5" aria-hidden />
                Contraseña temporal
              </Label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-semibold">
                  {verClave.passwordTemporal}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => void copiarVerClave()}
                >
                  {copiadoVerClave ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <Copy className="size-3" aria-hidden />
                  )}
                  {copiadoVerClave ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setVerClave(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoDesactivar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoDesactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja usuario</DialogTitle>
            <DialogDescription>
              ¿Está seguro de dar de baja la cuenta <strong>{dialogoDesactivar?.username}</strong>?
              El usuario perderá el acceso al sistema hasta que se reactive.
            </DialogDescription>
          </DialogHeader>

          {desactivarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{desactivarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoDesactivar(null)}
              disabled={desactivando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={ejecutarDesactivar}
              disabled={desactivando}
            >
              {desactivando ? 'Dando de baja...' : 'Dar de baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoReactivar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoReactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Volver a activar usuario</DialogTitle>
            <DialogDescription>
              ¿Está seguro de volver a activar la cuenta <strong>{dialogoReactivar?.username}</strong>?
              El usuario volverá a poder ingresar al sistema.
            </DialogDescription>
          </DialogHeader>

          {reactivarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{reactivarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoReactivar(null)}
              disabled={reactivando}
            >
              Cancelar
            </Button>
            <Button onClick={ejecutarReactivar} disabled={reactivando}>
              {reactivando ? 'Volviendo a activar...' : 'Volver a activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}