import type { Rol } from './types/rbac.ts'
import { PERMISO_TOTAL } from './types/rbac.ts'
import { CATALOGO_PERMISOS } from './permissions.ts'
import type { PermissionCode } from './types/rbac.ts'

/**
 * Plantillas de roles iniciales (contrato compartido frontend/API).
 *
 * IMPORTANTE: no son roles rígidos ni un tipo cerrado. Son DATOS iniciales que
 * en una fase futura podrán editarse, crearse ("Coordinador Académico", ...),
 * renombrarse, asignar/quitar permisos o desactivarse.
 *
 * La autorización SIEMPRE depende de los permisos del rol (`permisos`), nunca
 * de comparar el nombre/código del rol.
 */
const tipoPermiso = (codigo: keyof typeof CATALOGO_PERMISOS): PermissionCode =>
  codigo

export const ROLES_INICIALES: Rol[] = [
  {
    id: 'director',
    codigo: 'director',
    nombre: 'Director',
    descripcion: 'Dirección del centro educativo. Todos los permisos.',
    activo: true,
    permisos: [PERMISO_TOTAL],
  },
  {
    id: 'profesor',
    codigo: 'profesor',
    nombre: 'Profesor',
    descripcion: 'Docente con acceso a sus grupos, asistencia y notas.',
    activo: true,
    permisos: [
      tipoPermiso('alumnos.ver'),
      tipoPermiso('salones.mis'),
      tipoPermiso('asistencia.ver'),
      tipoPermiso('asistencia.registrar'),
      tipoPermiso('notas.ver'),
      tipoPermiso('notas.registrar'),
      tipoPermiso('reportes.ver'),
    ],
  },
  {
    id: 'secretaria',
    codigo: 'secretaria',
    nombre: 'Secretaría',
    descripcion: 'Gestión administrativa: alumnos, matrículas y pagos.',
    activo: true,
    permisos: [
      tipoPermiso('alumnos.ver'),
      tipoPermiso('alumnos.verTodos'),
      tipoPermiso('alumnos.crear'),
      tipoPermiso('alumnos.editar'),
      tipoPermiso('profesores.ver'),
      tipoPermiso('cursos.ver'),
      tipoPermiso('grados.ver'),
      tipoPermiso('matriculas.ver'),
      tipoPermiso('matriculas.crear'),
      tipoPermiso('asistencia.ver'),
      tipoPermiso('notas.ver'),
      tipoPermiso('pagos.ver'),
      tipoPermiso('pagos.registrar'),
      tipoPermiso('reportes.ver'),
    ],
  },
  {
    id: 'personal',
    codigo: 'personal',
    nombre: 'Personal',
    descripcion: 'Personal auxiliar con acceso de consulta y asistencia.',
    activo: true,
    permisos: [
      tipoPermiso('alumnos.ver'),
      tipoPermiso('alumnos.verTodos'),
      tipoPermiso('asistencia.ver'),
      tipoPermiso('asistencia.registrar'),
      tipoPermiso('pagos.ver'),
      tipoPermiso('reportes.ver'),
    ],
  },
]

/** Acceso por id para los casos límite (p. ej. selector demo). */
export function obtenerRolPorId(id: string): Rol | undefined {
  return ROLES_INICIALES.find((rol) => rol.id === id)
}