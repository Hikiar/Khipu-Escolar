import type { PermissionCode, Permiso } from './types/rbac.ts'

/**
 * Catálogo central de permisos del sistema, formato `modulo.accion`.
 *
 * Se declara `as const` para obtener literales con autocompletado, pero el
 * tipo `PermissionCode` sigue siendo `string`: la arquitectura permite
 * agregar módulos y permisos personalizados en el futuro sin tocar tipos.
 */
export const CATALOGO_PERMISOS = {
  'alumnos.ver': 'Ver listado y fichas de alumnos',
  'alumnos.verTodos': 'Ver listado global de alumnos',
  'alumnos.crear': 'Registrar nuevos alumnos',
  'alumnos.editar': 'Editar datos de alumnos',
  'alumnos.eliminar': 'Eliminar alumnos',

  'profesores.ver': 'Ver listado y fichas de profesores',
  'profesores.crear': 'Registrar nuevos profesores',
  'profesores.editar': 'Editar datos de profesores',
  'profesores.eliminar': 'Eliminar profesores',

  'cursos.ver': 'Ver cursos y materias',
  'cursos.crear': 'Crear cursos y materias',
  'cursos.editar': 'Editar cursos y materias',
  'cursos.eliminar': 'Eliminar cursos y materias',

  'grados.ver': 'Ver grados y secciones',
  'grados.crear': 'Crear grados y secciones',
  'grados.editar': 'Editar grados y secciones',
  'grados.eliminar': 'Eliminar grados y secciones',

  'salones.mis': 'Ver mis salones y sus alumnos',

  'matriculas.ver': 'Ver matrículas',
  'matriculas.crear': 'Registrar matrículas',
  'matriculas.anular': 'Anular matrículas',

  'asistencia.ver': 'Ver registros de asistencia',
  'asistencia.registrar': 'Registrar asistencia',

  'notas.ver': 'Ver calificaciones',
  'notas.registrar': 'Registrar calificaciones',

  'pagos.ver': 'Ver pagos y cuotas',
  'pagos.registrar': 'Registrar pagos',
  'pagos.anular': 'Anular pagos',

  'conceptosPago.ver': 'Ver conceptos de pago',
  'conceptosPago.crear': 'Crear conceptos de pago',
  'conceptosPago.editar': 'Editar conceptos de pago',
  'conceptosPago.eliminar': 'Eliminar conceptos de pago',

  'reportes.ver': 'Ver reportes y estadísticas',

  'configuraciones.ver': 'Ver configuraciones de evaluación',
  'configuraciones.crear': 'Crear configuraciones de evaluación',
  'configuraciones.editar': 'Editar configuraciones de evaluación',
  'configuraciones.eliminar': 'Eliminar configuraciones de evaluación',

  'competencias.ver': 'Ver competencias de curso',
  'competencias.crear': 'Crear competencias de curso',
  'competencias.editar': 'Editar competencias de curso',
  'competencias.eliminar': 'Eliminar competencias de curso',

  'modelos.ver': 'Ver modelos de evaluación',
  'modelos.crear': 'Crear modelos de evaluación',
  'modelos.editar': 'Editar modelos de evaluación',
  'modelos.eliminar': 'Eliminar modelos de evaluación',

  'asignaciones.ver': 'Ver asignaciones de curso',
  'asignaciones.crear': 'Crear asignaciones de curso',
  'asignaciones.eliminar': 'Eliminar asignaciones de curso',

  'periodos.ver': 'Ver periodos académicos',
  'periodos.crear': 'Crear periodos académicos',
  'periodos.activar': 'Activar un periodo académico',
  'periodos.cerrar': 'Cerrar un periodo académico',

  'usuarios.gestionar': 'Administrar cuentas de usuario',
  'roles.gestionar': 'Administrar roles y permisos',
} as const satisfies Record<string, string>

export type CodigoPermisoCatalogado = keyof typeof CATALOGO_PERMISOS

/** Lista completa de `Permiso` generada a partir del catálogo. */
export const PERMISOS: Permiso[] = Object.entries(CATALOGO_PERMISOS).map(
  ([codigo, descripcion]) => ({
    id: codigo,
    codigo,
    modulo: codigo.split('.')[0],
    descripcion,
  }),
)

export function obtenerPermiso(codigo: PermissionCode): Permiso | undefined {
  return PERMISOS.find((permiso) => permiso.codigo === codigo)
}