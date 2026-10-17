import { Router } from 'express'
import { PERMISO_TOTAL } from '../../../shared/types/rbac.ts'
import { listarAuditoria } from '../../infra/repos/auditoria.ts'
import { exigirAuth, exigirPermiso } from '../middleware.ts'

/**
 * Lectura de la bitácora de auditoría (solo usuarios con permiso total).
 * La escritura la hace el middleware `auditarMutaciones`.
 */
export const routerAuditoria = Router()

routerAuditoria.get(
  '/',
  exigirAuth,
  exigirPermiso(PERMISO_TOTAL),
  (_req, res) => {
    res.json({ ok: true, registros: listarAuditoria() })
  },
)