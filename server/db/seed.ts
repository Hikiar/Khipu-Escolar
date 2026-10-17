import bcrypt from 'bcryptjs'
import { db, sqlite } from './client.ts'
import { AREAS_CNEB, GRADOS_POR_NIVEL, type NivelCurricular } from './cneb.ts'
import { autoCrearCompetenciasReferenciales } from '../domain/competencia.service.ts'
import {
  personas,
  usuarios,
  roles,
  permisos,
  rolPermisos,
  usuarioRoles,
  alumnos,
  docentes,
  docenteNiveles,
  docenteTitulos,
  grados,
  secciones,
  clases,
  cursos,
  cursoGrados,
  asignacionCursos,
  matriculas,
  periodosAcademicos,
  modelosEvaluacion,
  configuracionesEvaluacionCurso,
  conceptosPago,
} from './schema.ts'
import { eq, and } from 'drizzle-orm'
import { PERMISOS } from '../../shared/permissions.ts'
import { ROLES_INICIALES } from '../../shared/roles.ts'
import { generarCodigoInstitucional } from '../domain/codigos.service.ts'
import type { CodigoInstitucionalLetra } from '../../shared/codigosInstitucionales.ts'

/**
 * Semilla de desarrollo (idempotente).
 * Solo siembra cuando la base está vacía; los passwords demo se hashean con bcrypt.
 * Demo: D26000001/director.123 · P26000001/profesor.123 · S26000001/secretaria.123 ·
 * A26000001/personal.123 (usuario INACTIVO).
 */

function nuevaFecha() {
  return new Date().toISOString()
}

/** La base ya tiene datos: la app arranca sobre una BD preexistente. */
const MINIMO = Boolean(process.env.SEED_MINIMO === '1')

/** Periodo académico sembrado (compartido por catálogo, modelos y datos operativos). */
const periodoId = 'per-2026'

export function semillar() {
  // 0) Catálogo de permisos canónico (idempotente; también cubre BD existentes).
  for (const permiso of PERMISOS) {
    db.insert(permisos).values(permiso).onConflictDoNothing().run()
  }

  const rolesExistentes = db.select({ id: roles.id }).from(roles).limit(1).all()
  if (rolesExistentes.length > 0) {
    // BD ya sembrada (sea completa o mínima): reconciliar la malla de los roles
    // predefinidos con ROLES_INICIALES. No se tocan roles personalizados ni
    // permisos adicionales por usuario.
    sincronizarRolesIniciales()
    return
  }

  if (MINIMO) {
    semillarMinimo()
    return
  }

  semillarCompleto()
}

/** Sembrado mínimo (SEED_MINIMO=1): solo catálogo CNEB + usuarios demo + periodo.
 *  Sin docentes, secciones, clases, asignaciones, alumnos, matrículas ni conceptos. */
function semillarMinimo() {
  sembrarPermisosYRoles()
  sembrarUsuariosDemo()
  sembrarPeriodoYCatalogo()
  sembrarModelosEvaluacion()
}

/** Sembrado completo (demo del CNEB con datos operativos preasignados). */
function semillarCompleto() {
  sembrarPermisosYRoles()
  sembrarUsuariosDemo()
  sembrarPeriodoYCatalogo()
  sembrarModelosEvaluacion()
  sembrarDatosOperativos()
}

/** Permisos + roles + malla rol_permisos. */
function sembrarPermisosYRoles() {
  for (const rol of ROLES_INICIALES) {
    db.insert(roles)
      .values({
        id: rol.id,
        codigo: rol.codigo,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo,
      })
      .run()
    for (const codigoPermiso of rol.permisos) {
      db.insert(rolPermisos)
        .values({ rolId: rol.id, permisoId: codigoPermiso })
        .onConflictDoNothing()
        .run()
    }
  }
}

/** Personas + usuarios demo (mismos id que el mock para continuidad). */
function sembrarUsuariosDemo() {
  // Personas + usuarios demo (mismos id que el mock para continuidad).
  const demo: {
    personaId: string
    letra: CodigoInstitucionalLetra
    dni: string
    nombres: string
    apellidos: string
    correo: string
    rolIds: string[]
    password: string
    activo: boolean
  }[] = [
    {
      personaId: 'per-001',
      letra: 'D',
      dni: '10000001',
      nombres: 'Carlos',
      apellidos: 'Ramírez Torres',
      correo: 'director@colegio.gec.edu.pe',
      rolIds: ['director'],
      password: 'director.123',
      activo: true,
    },
    {
      personaId: 'per-002',
      letra: 'P',
      dni: '10000002',
      nombres: 'María',
      apellidos: 'Gómez Paredes',
      correo: 'maria.gomez@colegio.gec.edu.pe',
      rolIds: ['profesor'],
      password: 'profesor.123',
      activo: true,
    },
    {
      personaId: 'per-003',
      letra: 'S',
      dni: '10000003',
      nombres: 'Lucía',
      apellidos: 'Fernández Ríos',
      correo: 'secretaria@colegio.gec.edu.pe',
      rolIds: ['secretaria'],
      password: 'secretaria.123',
      activo: true,
    },
    {
      personaId: 'per-004',
      letra: 'A',
      dni: '10000004',
      nombres: 'Jorge',
      apellidos: 'Díaz Campos',
      correo: 'personal@colegio.gec.edu.pe',
      rolIds: ['personal'],
      password: 'personal.123',
      activo: false,
    },
  ]

  for (const [indice, d] of demo.entries()) {
    const codigoInstitucional = generarCodigoInstitucional(d.letra)
    db.insert(personas)
      .values({
        id: d.personaId,
        dni: d.dni,
        codigoInstitucional,
        nombres: d.nombres,
        apellidos: d.apellidos,
        correo: d.correo,
        telefono: `9${String(87000000 + indice)}`,
      })
      .run()
    const usuarioId = `usr-00${indice + 1}`
    db.insert(usuarios)
      .values({
        id: usuarioId,
        personaId: d.personaId,
        username: codigoInstitucional,
        activo: d.activo,
        passwordHash: bcrypt.hashSync(d.password, 10),
        createdAt: nuevaFecha(),
        desactivadoAt: d.activo ? null : nuevaFecha(),
      })
      .run()
    for (const rolId of d.rolIds) {
      db.insert(usuarioRoles).values({ usuarioId, rolId }).run()
    }
  }
}

/** Periodo académico + catálogo CNEB: grados, áreas/cursos y plan cursoGrado. */
function sembrarPeriodoYCatalogo() {
  // Catálogo académico del periodo 2026.
  db.insert(periodosAcademicos)
    .values({
      id: periodoId,
      codigo: '2026',
      nombre: 'Año Académico 2026',
      fechaInicio: '2026-03-02',
      fechaFin: '2026-12-18',
      estado: 'ACTIVO',
      bandasLiteral:
        '{"cualitativa":{"AD":"Logro destacado","A":"Logro esperado","B":"En proceso","C":"En inicio"}}',
    })
    .run()

  // Grados por nivel (Inicial, Primaria, Secundaria).
  const gradosSeed = (Object.entries(GRADOS_POR_NIVEL) as [NivelCurricular, { id: string; codigo: string; nombre: string; orden: number }[]][]).flatMap(
    ([nivel, gradosDeNivel]) =>
      gradosDeNivel.map((g) => ({
        id: g.id,
        codigo: g.codigo,
        nombre: g.nombre,
        nivel,
        orden: g.orden,
      })),
  )
  for (const g of gradosSeed) db.insert(grados).values(g).run()

  // Áreas curriculares del CNEB como catálogo de cursos.
  const cursosSeed = AREAS_CNEB.map((a) => ({
    id: a.id,
    codigo: a.codigo,
    nombre: a.nombre,
    descripcion: a.descripcion,
  }))
  for (const c of cursosSeed) db.insert(cursos).values(c).run()

  // Plan de estudios: cada área se dicta en todos los grados de sus niveles.
  for (const area of AREAS_CNEB) {
    for (const [nivel, _competencias] of Object.entries(area.niveles)) {
      const gradosDeNivel = GRADOS_POR_NIVEL[nivel as NivelCurricular]
      for (const g of gradosDeNivel) {
        db.insert(cursoGrados)
          .values({ cursoId: area.id, gradoId: g.id, horasSemana: area.horasSemana, orden: 0 })
          .run()
      }
    }
  }
}

/** Modelos de evaluación + configuraciones por curso/grado + competencias referenciales. */
function sembrarModelosEvaluacion() {
  // Configuración de evaluación: Matemática→COMPETENCIAS 3º y 4º; Comunicación→EXAMEN 3º.
  // El resto del plan se auto-configura con COMPETENCIAS.
  const modelosSeed = [
    {
      id: 'modelo-competencias',
      codigo: 'COMPETENCIAS',
      nombre: 'Por competencias',
      descripcion: 'Evaluación por competencias con trabajos calificados.',
    },
    {
      id: 'modelo-examen',
      codigo: 'EXAMEN',
      nombre: 'Por examen',
      descripcion: 'Evaluación mediante exámenes con notas AD/A/B/C.',
    },
    {
      id: 'modelo-personalizado',
      codigo: 'PERSONALIZADO',
      nombre: 'Personalizado',
      descripcion: 'Combinación configurable de competencias y examen.',
    },
  ]
  for (const m of modelosSeed) db.insert(modelosEvaluacion).values(m).run()

  const configSeed = [
    { id: 'cfg-mate-3', cursoId: 'cur-mate', gradoId: 'grad-3-prim', modelo: 'modelo-competencias' },
    { id: 'cfg-com-3', cursoId: 'cur-com', gradoId: 'grad-3-prim', modelo: 'modelo-examen' },
    { id: 'cfg-mate-4', cursoId: 'cur-mate', gradoId: 'grad-4-prim', modelo: 'modelo-competencias' },
  ]
  const combosExplicitos = new Set(configSeed.map((c) => `${c.cursoId}|${c.gradoId}`))
  for (const c of configSeed) {
    db.insert(configuracionesEvaluacionCurso)
      .values({
        id: c.id,
        cursoId: c.cursoId,
        gradoId: c.gradoId,
        periodoId,
        modeloEvaluacionId: c.modelo,
        activo: true,
      })
      .run()
  }

  for (const area of AREAS_CNEB) {
    for (const [nivel, _competencias] of Object.entries(area.niveles)) {
      const gradosDeNivel = GRADOS_POR_NIVEL[nivel as NivelCurricular]
      for (const g of gradosDeNivel) {
        if (combosExplicitos.has(`${area.id}|${g.id}`)) continue
        db.insert(configuracionesEvaluacionCurso)
          .values({
            id: `cfg-${g.id}-${area.id}`,
            cursoId: area.id,
            gradoId: g.id,
            periodoId,
            modeloEvaluacionId: 'modelo-competencias',
            activo: true,
          })
          .run()
      }
    }
  }

  // Competencias referenciales del CNEB para cada configuración COMPETENCIAS.
  for (const cfg of db.select().from(configuracionesEvaluacionCurso).all()) {
    const modelo = db.select().from(modelosEvaluacion).where(eq(modelosEvaluacion.id, cfg.modeloEvaluacionId)).get()
    if (modelo?.codigo === 'COMPETENCIAS') {
      autoCrearCompetenciasReferenciales(cfg.id, cfg.cursoId, cfg.gradoId)
    }
  }
}

/** Datos operativos demo: secciones, clases, docentes, asignaciones, alumnos, matrículas y conceptos. */
function sembrarDatosOperativos() {
  const seccionesSeed = [
    { id: 'sec-3a', gradoId: 'grad-3-prim', nombre: 'A', turno: 'MAÑANA' },
    { id: 'sec-3b', gradoId: 'grad-3-prim', nombre: 'B', turno: 'MAÑANA' },
    { id: 'sec-4a', gradoId: 'grad-4-prim', nombre: 'A', turno: 'MAÑANA' },
  ]
  for (const s of seccionesSeed) db.insert(secciones).values(s).run()

  const clasesSeed = [
    {
      id: 'cla-3a-2026',
      periodoId,
      gradoId: 'grad-3-prim',
      seccionId: 'sec-3a',
      tutorDocenteId: 'per-002',
      estado: 'ABIERTA',
      vacantes: 30,
    },
    {
      id: 'cla-3b-2026',
      periodoId,
      gradoId: 'grad-3-prim',
      seccionId: 'sec-3b',
      tutorDocenteId: null,
      estado: 'ABIERTA',
      vacantes: 30,
    },
    {
      id: 'cla-4a-2026',
      periodoId,
      gradoId: 'grad-4-prim',
      seccionId: 'sec-4a',
      tutorDocenteId: null,
      estado: 'ABIERTA',
      vacantes: 30,
    },
  ]
  db.insert(docentes)
    .values({ personaId: 'per-002', especialidad: 'Matemática', estado: 'ACTIVO' })
    .run()
  db.insert(docenteNiveles).values({ docenteId: 'per-002', nivel: 'PRIMARIA' }).run()
  db.insert(docenteTitulos)
    .values({ docenteId: 'per-002', nivel: 'PRIMARIA', titulo: 'Lic. en Educación Primaria' })
    .run()
  for (const c of clasesSeed) db.insert(clases).values(c).run()

  db.insert(asignacionCursos)
    .values({ claseId: 'cla-3a-2026', cursoId: 'cur-mate', docenteId: 'per-002' })
    .run()
  db.insert(asignacionCursos)
    .values({ claseId: 'cla-3b-2026', cursoId: 'cur-mate', docenteId: 'per-002' })
    .run()
  db.insert(asignacionCursos)
    .values({ claseId: 'cla-3a-2026', cursoId: 'cur-com', docenteId: 'per-002' })
    .run()

  // Alumnos de 3º (A y B) con matrículas ACTIVAS.
  // El código institucional (E) se genera automáticamente en el alta.
  const alumnosSeed = [
    { personaId: 'per-101', nombres: 'Ana', apellidos: 'Paredes Linares', claseId: 'cla-3a-2026' },
    { personaId: 'per-102', nombres: 'Bruno', apellidos: 'Salas Vega', claseId: 'cla-3a-2026' },
    { personaId: 'per-103', nombres: 'Carla', apellidos: 'Mendoza Quispe', claseId: 'cla-3a-2026' },
    { personaId: 'per-104', nombres: 'Diego', apellidos: 'Rojas Flores', claseId: 'cla-3b-2026' },
    { personaId: 'per-105', nombres: 'Elena', apellidos: 'Castro Núñez', claseId: 'cla-3b-2026' },
  ]
  for (const [i, a] of alumnosSeed.entries()) {
    db.insert(personas)
      .values({
        id: a.personaId,
        dni: `2000${String(i + 1).padStart(3, '0')}`,
        codigoInstitucional: generarCodigoInstitucional('E'),
        nombres: a.nombres,
        apellidos: a.apellidos,
      })
      .run()
    db.insert(alumnos)
      .values({
        personaId: a.personaId,
        ingresoAt: '2026-03-02',
        estado: 'ACTIVO',
      })
      .run()
    db.insert(matriculas)
      .values({
        id: `mat-00${i + 1}`,
        alumnoId: a.personaId,
        claseId: a.claseId,
        periodoId,
        registradoPor: 'usr-003',
        fechaRegistro: nuevaFecha(),
        estado: 'ACTIVA',
      })
      .run()
  }

  // Conceptos de pago del periodo.
  const conceptosSeed = [
    {
      id: 'con-matric',
      periodoId,
      codigo: 'MATRICULA-2026',
      descripcion: 'Matrícula anual 2026',
      tipo: 'MATRICULA',
      montoBase: 150,
      fechaVencimiento: '2026-03-15',
      obligatorio: true,
    },
    {
      id: 'con-pens-03',
      periodoId,
      codigo: 'PENSION-BASICA',
      descripcion: 'Pensión mensual básica',
      tipo: 'PENSION',
      montoBase: 250,
      fechaVencimiento: null,
      obligatorio: true,
    },
  ]
  for (const c of conceptosSeed) db.insert(conceptosPago).values(c).run()
}

export function cerrarBase() {
  sqlite.close()
}

/**
 * Reconciliación idempotente de la malla rol_permisos de los roles
 * predefinidos contra ROLES_INICIALES. Útil para bases ya sembradas que
 * queden desactualizadas tras evolucionar el contrato de roles/permisos.
 */
function sincronizarRolesIniciales() {
  for (const rol of ROLES_INICIALES) {
    const guardado = db.select({ id: roles.id }).from(roles).where(eq(roles.id, rol.id)).get()
    if (!guardado) continue

    const actuales = new Set(
      db
        .select({ permisoId: rolPermisos.permisoId })
        .from(rolPermisos)
        .where(eq(rolPermisos.rolId, rol.id))
        .all()
        .map((r) => r.permisoId),
    )

    for (const codigoPermiso of rol.permisos) {
      if (!actuales.has(codigoPermiso)) {
        db.insert(rolPermisos)
          .values({ rolId: rol.id, permisoId: codigoPermiso })
          .run()
      }
    }

    const deseados = new Set(rol.permisos)
    for (const permisoId of actuales) {
      if (!deseados.has(permisoId)) {
        db.delete(rolPermisos)
          .where(and(eq(rolPermisos.rolId, rol.id), eq(rolPermisos.permisoId, permisoId)))
          .run()
      }
    }
  }
}