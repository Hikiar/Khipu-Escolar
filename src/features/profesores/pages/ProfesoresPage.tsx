import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { Can } from '@/components/guards/Can'
import { useBuscador } from '@/hooks/useBuscador'
import {
  crearCuentaDocente,
  desactivarDocente,
  reactivarDocente,
  type Docente,
  type CrearCuentaDocenteResultado,
} from '@/services/profesoresService'
import { Plus, UsersRound } from 'lucide-react'
import { useProfesores } from '../hooks/useProfesores'
import { useProfesorForm } from '../hooks/useProfesorForm'
import { CuentaCreadaDialog } from '../components/CuentaCreadaDialog'
import { CuentaDocenteDialog } from '../components/CuentaDocenteDialog'
import { ProfesorCrearDialog } from '../components/ProfesorCrearDialog'
import { ProfesorDesactivarDialog } from '../components/ProfesorDesactivarDialog'
import { ProfesorEditarDialog } from '../components/ProfesorEditarDialog'
import { ProfesorReactivarDialog } from '../components/ProfesorReactivarDialog'
import { ProfesoresFiltros } from '../components/ProfesoresFiltros'
import { ProfesoresTable } from '../components/ProfesoresTable'


export function ProfesoresPage() {
  const navigate = useNavigate()
  const listado = useProfesores()
  const form = useProfesorForm({
    recargar: listado.cargarDocentes,
    marcarErrorCarga: listado.marcarErrorCarga,
  })

  const [dialogoDesactivar, setDialogoDesactivar] = useState<Docente | null>(null)
  const [desactivando, setDesactivando] = useState(false)
  const [desactivarError, setDesactivarError] = useState<string | null>(null)

  const [dialogoReactivar, setDialogoReactivar] = useState<Docente | null>(null)
  const [reactivando, setReactivando] = useState(false)
  const [reactivarError, setReactivarError] = useState<string | null>(null)

  const [dialogoCuenta, setDialogoCuenta] = useState<Docente | null>(null)
  const [creandoCuenta, setCreandoCuenta] = useState(false)
  const [cuentaError, setCuentaError] = useState<string | null>(null)
  const [cuentaCreada, setCuentaCreada] = useState<CrearCuentaDocenteResultado | null>(null)
  const [copiadoCuenta, setCopiadoCuenta] = useState<'codigo' | 'password' | null>(null)

  const buscador = useBuscador(listado.docentes, (d) => [
    d.dni,
    d.codigoInstitucional,
    d.nombres,
    d.apellidos,
    d.especialidad ?? '',
  ])

  function abrirConfirmarDesactivar(docente: Docente) {
    setDialogoDesactivar(docente)
    setDesactivarError(null)
  }

  async function ejecutarDesactivar() {
    if (!dialogoDesactivar) return
    setDesactivando(true)
    setDesactivarError(null)

    const resultado = await desactivarDocente(dialogoDesactivar.id)

    setDesactivando(false)

    if (resultado.ok === false) {
      setDesactivarError(resultado.error)
      return
    }
    setDialogoDesactivar(null)
    void listado.cargarDocentes()
  }

  function abrirConfirmarReactivar(docente: Docente) {
    setDialogoReactivar(docente)
    setReactivarError(null)
  }

  async function ejecutarReactivar() {
    if (!dialogoReactivar) return
    setReactivando(true)
    setReactivarError(null)

    const resultado = await reactivarDocente(dialogoReactivar.id)

    setReactivando(false)

    if (resultado.ok === false) {
      setReactivarError(resultado.error)
      return
    }
    setDialogoReactivar(null)
    void listado.cargarDocentes()
  }

  function abrirDialogoCuenta(docente: Docente) {
    setDialogoCuenta(docente)
    setCuentaError(null)
    setCuentaCreada(null)
  }

  async function ejecutarCrearCuenta() {
    if (!dialogoCuenta) return
    setCreandoCuenta(true)
    setCuentaError(null)

    const resultado = await crearCuentaDocente(dialogoCuenta.id)

    setCreandoCuenta(false)

    if (resultado.ok === false) {
      setCuentaError(resultado.error)
      return
    }
    setCuentaCreada(resultado.data)
    setDialogoCuenta(null)
    void listado.cargarDocentes()
  }

  async function copiarCuenta(texto: string, tipo: 'codigo' | 'password') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiadoCuenta(tipo)
      window.setTimeout(() => setCopiadoCuenta(null), 1500)
    } catch {
      setCopiadoCuenta(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profesores"
        description="Gestión del cuerpo docente"
        icon={<UsersRound />}
        actions={
          <Can permission="profesores.crear">
            <Button onClick={form.abrirDialogoCrear}>
              <Plus className="size-4" aria-hidden />
              Registrar profesor
            </Button>
          </Can>
        }
      />

      <ProfesoresFiltros
        filtroEstado={listado.filtroEstado}
        onFiltroEstadoChange={listado.setFiltroEstado}
        buscador={buscador}
      />

      <ProfesoresTable
        estado={listado.estado}
        error={listado.error}
        docentes={listado.docentes}
        buscador={buscador}
        onReintentar={listado.reintentar}
        onCrear={form.abrirDialogoCrear}
        onVer={(docente) => navigate(`/profesores/${docente.id}`)}
        onEditar={(docente) => void form.abrirDialogoEditar(docente)}
        onDesactivar={abrirConfirmarDesactivar}
        onReactivar={abrirConfirmarReactivar}
        onCuenta={abrirDialogoCuenta}
      />

      <ProfesorCrearDialog
        dialogoCrearAbierto={form.dialogoCrearAbierto}
        setDialogoCrearAbierto={form.setDialogoCrearAbierto}
        formError={form.formError}
        formDni={form.formDni}
        setFormDni={form.setFormDni}
        formNombres={form.formNombres}
        setFormNombres={form.setFormNombres}
        formApellidos={form.formApellidos}
        setFormApellidos={form.setFormApellidos}
        formNiveles={form.formNiveles}
        setFormNiveles={form.setFormNiveles}
        formTitulos={form.formTitulos}
        setFormTitulos={form.setFormTitulos}
        formCorreo={form.formCorreo}
        setFormCorreo={form.setFormCorreo}
        formTelefono={form.formTelefono}
        setFormTelefono={form.setFormTelefono}
        formEspecialidad={form.formEspecialidad}
        setFormEspecialidad={form.setFormEspecialidad}
        formIngresoAt={form.formIngresoAt}
        setFormIngresoAt={form.setFormIngresoAt}
        formEnviando={form.formEnviando}
        enviarCrear={form.enviarCrear}
      />

      <ProfesorEditarDialog
        dialogoEditarAbierto={form.dialogoEditarAbierto}
        setDialogoEditarAbierto={form.setDialogoEditarAbierto}
        formError={form.formError}
        formDni={form.formDni}
        setFormDni={form.setFormDni}
        formNombres={form.formNombres}
        setFormNombres={form.setFormNombres}
        formApellidos={form.formApellidos}
        setFormApellidos={form.setFormApellidos}
        formNiveles={form.formNiveles}
        setFormNiveles={form.setFormNiveles}
        formCorreo={form.formCorreo}
        setFormCorreo={form.setFormCorreo}
        formTelefono={form.formTelefono}
        setFormTelefono={form.setFormTelefono}
        formEspecialidad={form.formEspecialidad}
        setFormEspecialidad={form.setFormEspecialidad}
        formTitulos={form.formTitulos}
        setFormTitulos={form.setFormTitulos}
        formEnviando={form.formEnviando}
        enviarEditar={form.enviarEditar}
      />

      <ProfesorDesactivarDialog
        dialogoDesactivar={dialogoDesactivar}
        setDialogoDesactivar={setDialogoDesactivar}
        desactivando={desactivando}
        desactivarError={desactivarError}
        ejecutarDesactivar={ejecutarDesactivar}
      />

      <ProfesorReactivarDialog
        dialogoReactivar={dialogoReactivar}
        setDialogoReactivar={setDialogoReactivar}
        reactivando={reactivando}
        reactivarError={reactivarError}
        ejecutarReactivar={ejecutarReactivar}
      />

      <CuentaDocenteDialog
        dialogoCuenta={dialogoCuenta}
        setDialogoCuenta={setDialogoCuenta}
        creandoCuenta={creandoCuenta}
        cuentaError={cuentaError}
        ejecutarCrearCuenta={ejecutarCrearCuenta}
      />

      <CuentaCreadaDialog
        cuentaCreada={cuentaCreada}
        setCuentaCreada={setCuentaCreada}
        copiadoCuenta={copiadoCuenta}
        copiarCuenta={copiarCuenta}
      />
    </div>
  )
}
