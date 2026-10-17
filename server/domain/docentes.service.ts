import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { exito, fallo, paginar, type ListadoConTotal, type Paginacion, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as rbac from '../infra/repos/rbac.ts'
import { type NivelCurricular } from '../db/cneb.ts'
import { generarCodigoInstitucional } from './codigos.service.ts'
import { crearUsuario, type UsuarioCreado } from './usuarios.service.ts'

type DocenteRow = typeof s.docentes.$inferSelect
type PersonaRow = typeof s.personas.$inferSelect

/** Niveles curriculares reconocidos para la asignación de docentes. */
const NIVELES_VALIDOS: NivelCurricular[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA']

/**
 * Servicio de gestión de docentes.
 * Reglas de negocio:
 * - Un docente está vinculado a una Persona (1:1 por personaId).
 * - El alta requiere Persona existente y DNI único (en persona).
 * - Todo docente debe declarar al menos un nivel donde dicta (INICIAL/PRIMARIA/SECUNDARIA).
 * - La edición permite actualizar datos de Persona, especialidad/título/estado y niveles.
 * - Desactivar = estado 'INACTIVO'.
 * - Eliminar no está permitido si tiene asignaciones de curso activas.
 */

export interface TituloDocente {
  nivel: NivelCurricular
  titulo: string
}

export interface DocenteDto {
  id: string // personaId
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  codigoInstitucional: string
  especialidad?: string
  titulos: TituloDocente[]
  ingresoAt?: string
  estado: 'ACTIVO' | 'INACTIVO'
  niveles: NivelCurricular[]
  /** ¿La persona ya tiene cuenta de acceso? (evita cuentas duplicadas). */
  tieneCuenta: boolean
}

export interface CrearDocenteInput {
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  especialidad?: string
  titulos?: TituloDocente[]
  ingresoAt?: string
  niveles?: NivelCurricular[]
}

export interface ActualizarDocenteInput {
  dni?: string
  nombres?: string
  apellidos?: string
  correo?: string
  telefono?: string
  especialidad?: string
  titulos?: TituloDocente[]
  estado?: 'ACTIVO' | 'INACTIVO'
  niveles?: NivelCurricular[]
}

function nivelesValidos(niveles: NivelCurricular[] | undefined): NivelCurricular[] | null {
  if (!niveles) return null
  const unicos = [...new Set(niveles)]
  const invalidos = unicos.filter((n) => !NIVELES_VALIDOS.includes(n))
  if (invalidos.length > 0) {
    return null
  }
  return unicos
}

function nivelesDeDocente(docenteId: string): NivelCurricular[] {
  return db
    .select()
    .from(s.docenteNiveles)
    .where(eq(s.docenteNiveles.docenteId, docenteId))
    .all()
    .map((f) => f.nivel as NivelCurricular)
}

/** Valida y normaliza títulos por nivel (un título por nivel, sin entradas vacías). */
function titulosValidos(titulos: TituloDocente[] | undefined): TituloDocente[] | null {
  if (!titulos) return null
  const limpios: TituloDocente[] = []
  const vistos = new Set<string>()
  for (const t of titulos) {
    if (!NIVELES_VALIDOS.includes(t.nivel)) {
      return null
    }
    const titulo = t.titulo.trim()
    if (titulo.length === 0) continue
    if (vistos.has(t.nivel)) {
      return null
    }
    vistos.add(t.nivel)
    limpios.push({ nivel: t.nivel, titulo })
  }
  return limpios
}

function titulosDeDocente(docenteId: string): TituloDocente[] {
  return db
    .select()
    .from(s.docenteTitulos)
    .where(eq(s.docenteTitulos.docenteId, docenteId))
    .all()
    .map((f) => ({ nivel: f.nivel as NivelCurricular, titulo: f.titulo }))
}

function aDocenteDto(
  docente: DocenteRow,
  persona: PersonaRow | null,
  niveles: NivelCurricular[],
  titulos: TituloDocente[],
): DocenteDto {
  return {
    id: docente.personaId,
    dni: persona?.dni ?? '',
    nombres: persona?.nombres ?? '',
    apellidos: persona?.apellidos ?? '',
    correo: persona?.correo ?? undefined,
    telefono: persona?.telefono ?? undefined,
    codigoInstitucional: persona?.codigoInstitucional ?? '',
    especialidad: docente.especialidad ?? undefined,
    titulos,
    ingresoAt: docente.ingresoAt ?? undefined,
    estado: docente.estado as 'ACTIVO' | 'INACTIVO',
    niveles,
    tieneCuenta: Boolean(rbac.obtenerUsuarioPorPersonaId(docente.personaId)),
  }
}

export async function listarDocentes(
  estado?: 'ACTIVO' | 'INACTIVO',
  paginacion?: Paginacion,
): Promise<ResultadoServicio<DocenteDto[] | ListadoConTotal<DocenteDto>>> {
  const filas = db
    .select()
    .from(s.docentes)
    .innerJoin(s.personas, eq(s.docentes.personaId, s.personas.id))
    .orderBy(s.personas.apellidos, s.personas.nombres)
    .all()

  const nivelesPorDocente = new Map<string, NivelCurricular[]>()
  for (const f of db.select().from(s.docenteNiveles).all()) {
    const actual = nivelesPorDocente.get(f.docenteId) ?? []
    actual.push(f.nivel as NivelCurricular)
    nivelesPorDocente.set(f.docenteId, actual)
  }

  const titulosPorDocente = new Map<string, TituloDocente[]>()
  for (const f of db.select().from(s.docenteTitulos).all()) {
    const actual = titulosPorDocente.get(f.docenteId) ?? []
    actual.push({ nivel: f.nivel as NivelCurricular, titulo: f.titulo })
    titulosPorDocente.set(f.docenteId, actual)
  }

  const data = filas
    .filter((f) => !estado || f.docentes.estado === estado)
    .map((f) =>
      aDocenteDto(
        f.docentes,
        f.personas,
        nivelesPorDocente.get(f.docentes.personaId) ?? [],
        titulosPorDocente.get(f.docentes.personaId) ?? [],
      ),
    )
  return exito(paginacion ? paginar(data, data.length, paginacion) : data)
}

export async function obtenerDocente(
  docenteId: string,
): Promise<ResultadoServicio<DocenteDto>> {
  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get() ?? null
  if (!docente) {
    return fallo<DocenteDto>('no-encontrado', `No existe un docente con id "${docenteId}".`)
  }
  const persona = rbac.obtenerPersonaPorId(docenteId)
  return exito(aDocenteDto(docente, persona, nivelesDeDocente(docenteId), titulosDeDocente(docenteId)))
}

export async function crearDocente(
  input: CrearDocenteInput,
): Promise<ResultadoServicio<DocenteDto>> {
  const dni = input.dni.trim()
  const nombres = input.nombres.trim()
  const apellidos = input.apellidos.trim()
  if (!dni || !nombres || !apellidos) {
    return fallo<DocenteDto>('invalido', 'DNI, nombres y apellidos son obligatorios.')
  }

  const niveles = nivelesValidos(input.niveles)
  if (niveles === null) {
    return fallo<DocenteDto>('invalido', 'Los niveles deben ser INICIAL, PRIMARIA o SECUNDARIA.')
  }
  if (niveles.length === 0) {
    return fallo<DocenteDto>('invalido', 'Debe indicar al menos un nivel donde dicta el docente.')
  }

  const titulos = titulosValidos(input.titulos)
  if (titulos === null) {
    return fallo<DocenteDto>('invalido', 'Los títulos deben corresponder a niveles válidos (un título por nivel).')
  }

  const personaExistente = rbac.obtenerPersonaPorDni(dni)
  if (personaExistente) {
    return fallo<DocenteDto>('invalido', `Ya existe una persona con DNI "${dni}".`)
  }

  const personaId = `per-${Date.now()}`
  rbac.insertarPersona({
    id: personaId,
    dni,
    codigoInstitucional: generarCodigoInstitucional('P'),
    nombres: input.nombres.trim(),
    apellidos: input.apellidos.trim(),
    correo: input.correo?.trim() ?? null,
    telefono: input.telefono?.trim() ?? null,
    fechaNacimiento: null,
    sexo: null,
    direccion: null,
  })

  db.insert(s.docentes).values({
    personaId,
    especialidad: input.especialidad?.trim() ?? null,
    ingresoAt: input.ingresoAt ?? new Date().toISOString(),
    estado: 'ACTIVO',
  }).run()

  for (const nivel of niveles) {
    db.insert(s.docenteNiveles).values({ docenteId: personaId, nivel }).run()
  }

  for (const t of titulos) {
    db.insert(s.docenteTitulos).values({ docenteId: personaId, nivel: t.nivel, titulo: t.titulo }).run()
  }

  const creado = db.select().from(s.docentes).where(eq(s.docentes.personaId, personaId)).get()
  const persona = rbac.obtenerPersonaPorId(personaId)
  if (!creado || !persona) {
    return fallo<DocenteDto>('no-disponible', 'No se pudo crear el docente.')
  }
  return exito(aDocenteDto(creado, persona, niveles, titulos))
}

export async function actualizarDocente(
  docenteId: string,
  input: ActualizarDocenteInput,
): Promise<ResultadoServicio<DocenteDto>> {
  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get() ?? null
  if (!docente) {
    return fallo<DocenteDto>('no-encontrado', `No existe un docente con id "${docenteId}".`)
  }
  const persona = rbac.obtenerPersonaPorId(docenteId)
  if (!persona) {
    return fallo<DocenteDto>('no-encontrado', 'Persona asociada no encontrada.')
  }

  if (input.dni && input.dni !== persona.dni) {
    const exists = rbac.obtenerPersonaPorDni(input.dni)
    if (exists) {
      return fallo<DocenteDto>('invalido', `El DNI "${input.dni}" ya está en uso.`)
    }
  }

  let niveles: NivelCurricular[] | null = null
  if (input.niveles !== undefined) {
    const validados = nivelesValidos(input.niveles)
    if (validados === null) {
      return fallo<DocenteDto>('invalido', 'Los niveles deben ser INICIAL, PRIMARIA o SECUNDARIA.')
    }
    if (validados.length === 0) {
      return fallo<DocenteDto>('invalido', 'Debe indicar al menos un nivel donde dicta el docente.')
    }
    niveles = validados
  }

  let titulos: TituloDocente[] | null = null
  if (input.titulos !== undefined) {
    const validados = titulosValidos(input.titulos)
    if (validados === null) {
      return fallo<DocenteDto>('invalido', 'Los títulos deben corresponder a niveles válidos (un título por nivel).')
    }
    titulos = validados
  }

  const personaPatch: Partial<typeof s.personas.$inferInsert> = {}
  if (input.dni) personaPatch.dni = input.dni.trim()
  if (input.nombres) personaPatch.nombres = input.nombres.trim()
  if (input.apellidos) personaPatch.apellidos = input.apellidos.trim()
  if (input.correo !== undefined) personaPatch.correo = input.correo?.trim() ?? null
  if (input.telefono !== undefined) personaPatch.telefono = input.telefono?.trim() ?? null
  if (Object.keys(personaPatch).length > 0) {
    rbac.actualizarPersona(docenteId, personaPatch)
  }

  const docentePatch: Partial<typeof s.docentes.$inferInsert> = {}
  if (input.especialidad !== undefined) docentePatch.especialidad = input.especialidad?.trim() ?? null
  if (input.estado) docentePatch.estado = input.estado
  if (Object.keys(docentePatch).length > 0) {
    db.update(s.docentes).set(docentePatch).where(eq(s.docentes.personaId, docenteId)).run()
  }

  if (niveles !== null) {
    db.delete(s.docenteNiveles).where(eq(s.docenteNiveles.docenteId, docenteId)).run()
    for (const nivel of niveles) {
      db.insert(s.docenteNiveles).values({ docenteId, nivel }).run()
    }
  }

  if (titulos !== null) {
    db.delete(s.docenteTitulos).where(eq(s.docenteTitulos.docenteId, docenteId)).run()
    for (const t of titulos) {
      db.insert(s.docenteTitulos).values({ docenteId, nivel: t.nivel, titulo: t.titulo }).run()
    }
  }

  const actualizado = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get()
  const personaActualizada = rbac.obtenerPersonaPorId(docenteId)
  if (!actualizado || !personaActualizada) {
    return fallo<DocenteDto>('no-disponible', 'No se pudo actualizar el docente.')
  }
  return exito(
    aDocenteDto(
      actualizado,
      personaActualizada,
      niveles ?? nivelesDeDocente(docenteId),
      titulos ?? titulosDeDocente(docenteId),
    ),
  )
}

export async function desactivarDocente(
  docenteId: string,
): Promise<ResultadoServicio<DocenteDto>> {
  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get() ?? null
  if (!docente) {
    return fallo<DocenteDto>('no-encontrado', `No existe un docente con id "${docenteId}".`)
  }
  if (docente.estado === 'INACTIVO') {
    return fallo<DocenteDto>('invalido', 'El docente ya está inactivo.')
  }

  const asignaciones = acad.contarDocenteAsignado(docenteId)
  if (asignaciones > 0) {
    return fallo<DocenteDto>('invalido', 'No se puede desactivar: el docente tiene asignaciones de curso activas.')
  }

  db.update(s.docentes).set({ estado: 'INACTIVO' }).where(eq(s.docentes.personaId, docenteId)).run()
  const actualizado = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get()
  const persona = rbac.obtenerPersonaPorId(docenteId)
  if (!actualizado || !persona) {
    return fallo<DocenteDto>('no-disponible', 'No se pudo desactivar el docente.')
  }
  return exito(aDocenteDto(actualizado, persona, nivelesDeDocente(docenteId), titulosDeDocente(docenteId)))
}

/** Vuelve a ACTIVO un docente desactivado (los datos históricos se conservan). */
export async function reactivarDocente(
  docenteId: string,
): Promise<ResultadoServicio<DocenteDto>> {
  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get() ?? null
  if (!docente) {
    return fallo<DocenteDto>('no-encontrado', `No existe un docente con id "${docenteId}".`)
  }
  if (docente.estado === 'ACTIVO') {
    return fallo<DocenteDto>('invalido', 'El docente ya está activo.')
  }

  db.update(s.docentes).set({ estado: 'ACTIVO' }).where(eq(s.docentes.personaId, docenteId)).run()
  const actualizado = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get()
  const persona = rbac.obtenerPersonaPorId(docenteId)
  if (!actualizado || !persona) {
    return fallo<DocenteDto>('no-disponible', 'No se pudo reactivar el docente.')
  }
  return exito(aDocenteDto(actualizado, persona, nivelesDeDocente(docenteId), titulosDeDocente(docenteId)))
}

/**
 * P2: alta de la cuenta de acceso para un docente ya registrado.
 * Reutiliza la persona (mantiene su código institucional) y le asigna el rol
 * Profesor con contraseña temporal (debe cambiarla en el primer ingreso).
 */
export async function crearCuentaDocente(
  docenteId: string,
): Promise<ResultadoServicio<UsuarioCreado>> {
  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get() ?? null
  if (!docente) {
    return fallo<UsuarioCreado>('no-encontrado', `No existe un docente con id "${docenteId}".`)
  }
  if (docente.estado !== 'ACTIVO') {
    return fallo<UsuarioCreado>('invalido', 'Solo los docentes activos pueden tener cuenta de acceso.')
  }
  const persona = rbac.obtenerPersonaPorId(docenteId)
  if (!persona) {
    return fallo<UsuarioCreado>('no-encontrado', 'Persona asociada no encontrada.')
  }
  if (rbac.obtenerUsuarioPorPersonaId(docenteId)) {
    return fallo<UsuarioCreado>('invalido', 'Este docente ya tiene una cuenta de acceso.')
  }

  const rolProfesor = rbac.obtenerRolPorCodigo('profesor')
  if (!rolProfesor) {
    return fallo<UsuarioCreado>('no-disponible', 'El rol Profesor no está disponible en el sistema.')
  }

  return crearUsuario({
    dni: persona.dni,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    rolIds: [rolProfesor.id],
  })
}