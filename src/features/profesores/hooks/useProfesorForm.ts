import { useState } from 'react'
import {
  obtenerDocente,
  crearDocente,
  actualizarDocente,
  type Docente,
  type CrearDocenteInput,
  type ActualizarDocenteInput,
} from '@/services/profesoresService'
import { NIVELES, type NivelCurricular } from '@/lib/nivelesCurso'

interface OpcionesUseProfesorForm {
  recargar: () => void
  marcarErrorCarga: (mensaje: string) => void
}

export function useProfesorForm({ recargar, marcarErrorCarga }: OpcionesUseProfesorForm) {
  const [dialogoCrearAbierto, setDialogoCrearAbierto] = useState(false)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)
  const [docenteEditando, setDocenteEditando] = useState<Docente | null>(null)

  const [formDni, setFormDni] = useState('')
  const [formNombres, setFormNombres] = useState('')
  const [formApellidos, setFormApellidos] = useState('')
  const [formCorreo, setFormCorreo] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formEspecialidad, setFormEspecialidad] = useState('')
  const [formTitulos, setFormTitulos] = useState<Record<NivelCurricular, string>>(() => ({
    INICIAL: '',
    PRIMARIA: '',
    SECUNDARIA: '',
  }))
  const [formIngresoAt, setFormIngresoAt] = useState('')
  const [formNiveles, setFormNiveles] = useState<NivelCurricular[]>([])
  const [formEnviando, setFormEnviando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function abrirDialogoCrear() {
    setFormDni('')
    setFormNombres('')
    setFormApellidos('')
    setFormCorreo('')
    setFormTelefono('')
    setFormEspecialidad('')
    setFormTitulos({ INICIAL: '', PRIMARIA: '', SECUNDARIA: '' })
    setFormIngresoAt('')
    setFormNiveles([])
    setFormError(null)
    setDialogoCrearAbierto(true)
  }

  async function abrirDialogoEditar(docente: Docente) {
    const resultado = await obtenerDocente(docente.id)
    if (resultado.ok && resultado.data) {
      const d = resultado.data
      setDocenteEditando(d)
      setFormDni(d.dni)
      setFormNombres(d.nombres)
      setFormApellidos(d.apellidos)
      setFormCorreo(d.correo ?? '')
      setFormTelefono(d.telefono ?? '')
      setFormEspecialidad(d.especialidad ?? '')
      setFormTitulos({
        INICIAL: '',
        PRIMARIA: '',
        SECUNDARIA: '',
      })
      for (const t of d.titulos ?? []) {
        setFormTitulos((prev) => ({ ...prev, [t.nivel]: t.titulo }))
      }
      setFormIngresoAt(d.ingresoAt ? d.ingresoAt.split('T')[0] : '')
      setFormNiveles(Array.isArray(d.niveles) ? d.niveles : [])
      setFormError(null)
      setDialogoEditarAbierto(true)
    } else {
      marcarErrorCarga('No se pudo cargar los datos del profesor.')
    }
  }

  async function enviarCrear() {
    setFormEnviando(true)
    setFormError(null)

    const titulos = NIVELES.filter((n) => formTitulos[n].trim() !== '').map((n) => ({
      nivel: n,
      titulo: formTitulos[n].trim(),
    }))

    const input: CrearDocenteInput = {
      dni: formDni,
      nombres: formNombres,
      apellidos: formApellidos,
      correo: formCorreo || undefined,
      telefono: formTelefono || undefined,
      especialidad: formEspecialidad || undefined,
      titulos: titulos.length > 0 ? titulos : undefined,
      ingresoAt: formIngresoAt || undefined,
      niveles: formNiveles,
    }

    const resultado = await crearDocente(input)

    setFormEnviando(false)

    if (resultado.ok === false) {
      setFormError(resultado.error)
      return
    }
    setDialogoCrearAbierto(false)
    recargar()
  }

  async function enviarEditar() {
    if (!docenteEditando) return
    setFormEnviando(true)
    setFormError(null)

    const titulos = NIVELES.filter((n) => formTitulos[n].trim() !== '').map((n) => ({
      nivel: n,
      titulo: formTitulos[n].trim(),
    }))

    const input: ActualizarDocenteInput = {
      dni: formDni,
      nombres: formNombres,
      apellidos: formApellidos,
      correo: formCorreo || undefined,
      telefono: formTelefono || undefined,
      especialidad: formEspecialidad || undefined,
      titulos: titulos.length > 0 ? titulos : undefined,
      niveles: formNiveles.length > 0 ? formNiveles : undefined,
    }

    const resultado = await actualizarDocente(docenteEditando.id, input)

    setFormEnviando(false)

    if (resultado.ok === false) {
      setFormError(resultado.error)
      return
    }
    setDialogoEditarAbierto(false)
    setDocenteEditando(null)
    recargar()
  }

  return {
    dialogoCrearAbierto,
    setDialogoCrearAbierto,
    dialogoEditarAbierto,
    setDialogoEditarAbierto,
    docenteEditando,
    formDni,
    setFormDni,
    formNombres,
    setFormNombres,
    formApellidos,
    setFormApellidos,
    formCorreo,
    setFormCorreo,
    formTelefono,
    setFormTelefono,
    formEspecialidad,
    setFormEspecialidad,
    formTitulos,
    setFormTitulos,
    formIngresoAt,
    setFormIngresoAt,
    formNiveles,
    setFormNiveles,
    formEnviando,
    formError,
    abrirDialogoCrear,
    abrirDialogoEditar,
    enviarCrear,
    enviarEditar,
  }
}
