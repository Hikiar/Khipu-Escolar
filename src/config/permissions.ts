/**
 * Re-export del contrato compartido. La fuente de verdad vive en `shared/permissions`.
 * Las importaciones `@/config/permissions` se conservan sin cambios.
 */
export { CATALOGO_PERMISOS, PERMISOS, obtenerPermiso } from '../../shared/permissions'
export type { CodigoPermisoCatalogado } from '../../shared/permissions'