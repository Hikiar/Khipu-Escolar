# Índice de documentación

Este índice distingue las referencias vigentes de los documentos que conservan decisiones y resultados anteriores. **Los planes históricos no son por sí solos instrucciones para implementar trabajo nuevo.** Antes de actuar, contrasta sus afirmaciones con el código y con el alcance del producto.

## Referencias vigentes

| Documento | Uso |
|---|---|
| [producto.md](producto.md) | Público, propósito, alcance actual y decisiones de producto aún pendientes. |
| [modelo-datos.md](modelo-datos.md) | Referencia conceptual del dominio y sus relaciones. Verificar siempre contra `server/db/schema.ts` y los servicios: el código es la fuente de verdad. |
| [Sistema de diseño](../DESIGN_SYSTEM.md) | Tokens, componentes y convenciones de interfaz. |
| [Plan de mejoras UX](../plan-frontend-ux.md) | Registro del trabajo y decisiones del plan UX. Antes de tomar una propuesta como pendiente, verificar su estado actual en el código. |

## Históricos y auditorías anteriores

Se mantienen en sus rutas actuales para no cambiar referencias durante este primer ordenamiento.

| Documento | Estado y uso |
|---|---|
| [Auditoría](../AUDITORIA.md) | Diagnóstico fechado en 2026-09-08 con actualizaciones posteriores. Es una fotografía histórica; verificar hallazgos antes de actuar. |
| [PLAN.md](../PLAN.md) | Plan posterior a la auditoría. Histórico; contiene fases cuyo estado debe contrastarse con el código. |
| [plan-frontend.md](../plan-frontend.md) | Diagnóstico UX anterior, sucedido por el plan de mejoras UX. Histórico. |
| [plan_cursos.md](../plan_cursos.md) | Plan de configuración y cursos anterior. Histórico; no tomar sus casillas pendientes como estado vigente. |
| [Fase 2](../plan-frontend-ux-fase2.md) · [Fase 3](../plan-frontend-ux-fase3.md) · [Fase 4](../plan-frontend-ux-fase4.md) · [Fase 5](../plan-frontend-ux-fase5.md) · [Fase 6](../plan-frontend-ux-fase6.md) | Informes de implementación y revisión por fase. Son evidencia histórica, no una cola automática de tareas. |

## Regla para mantener estos documentos

- Actualiza la orientación de producto cuando cambie una decisión de alcance.
- Actualiza el modelo conceptual cuando cambie el dominio y verifica su consistencia con el esquema.
- Mantén un solo plan activo por iniciativa; cierra o archiva planes al terminar.
- No dupliques resultados de implementación en varios planes sin enlazar una fuente principal.
- No muevas ni elimines documentación histórica sin revisar primero enlaces y referencias.
