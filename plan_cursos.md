# Plan de Implementación: Completar Integración Cursos ↔ Evaluación

## Estado Actual
- ✅ Curso CRUD + CursoGrado (Plan de Estudios) — **Completo**
- ✅ Trabajos/Exámenes/Calificaciones/Promedios — **Completo**
- ⚠️ **Falta**: ConfiguracionEvaluacionCurso + CompetenciaCurso + ModeloEvaluacion (CRUD administrativo)

---

## Fases de Implementación

### **Fase 1: Backend - ConfiguracionEvaluacionCurso + CompetenciaCurso**
| Tarea | Archivos | Estado |
|-------|----------|--------|
| 1.1 Domain service `configuracion.service.ts` (CRUD ConfiguracionEvaluacionCurso) | `server/domain/configuracion.service.ts` | ⬜ |
| 1.2 Domain service `competencia.service.ts` (CRUD CompetenciaCurso) | `server/domain/competencia.service.ts` | ⬜ |
| 1.3 Schemas Zod en `schemas.ts` | `server/api/schemas.ts` | ⬜ |
| 1.4 Router `configuracion.ts` + `competencia.ts` | `server/api/rutas/configuracion.ts`, `server/api/rutas/competencia.ts` | ⬜ |
| 1.5 Montar routers en `app.ts` | `server/api/app.ts` | ⬜ |
| 1.6 Auto-crear Configuracion al agregar CursoGrado | `server/domain/cursogrado.service.ts` | ⬜ |

### **Fase 2: Backend - ModeloEvaluacion**
| Tarea | Archivos | Estado |
|-------|----------|--------|
| 2.1 Domain service `modelo.service.ts` | `server/domain/modelo.service.ts` | ⬜ |
| 2.2 Router `modelo.ts` | `server/api/rutas/modelo.ts` | ⬜ |
| 2.3 Montar en `app.ts` | `server/api/app.ts` | ⬜ |

### **Fase 3: Auto-creación Configuracion al agregar CursoGrado**
| Tarea | Archivos | Estado |
|------|-----|--------|
| 3.1 Modificar `cursogrado.service.ts.agregarCursoAGrado()` para auto-crear ConfiguracionEvaluacionCurso | `server/domain/cursogrado.service.ts` | ⬜ |

### **Fase 4: Frontend - Configuracion + Competencias (UI en CursosPage)**
| Tarea | Archivos | Estado |
|------|-----|--------|
| 4.1 Servicios frontend: `configuracionService.ts`, `competenciaService.ts`, `modeloService.ts` | `src/services/` | ⬜ |
| 4.2 Nueva tab **"Config. Evaluación"** en `CursosPage.tsx` | `src/features/cursos/pages/CursosPage.tsx` | ⬜ |
| 4.3 Tab "Config. Evaluación": listado configuraciones por grado/periodo, dialog crear/editar | `src/features/cursos/pages/CursosPage.tsx` | ⬜ |
| 4.4 Detalle configuración → sub-tab "Competencias": CRUD competencias | `src/features/cursos/pages/CursosPage.tsx` | ⬜ |
| 4.4 Ampliar `catalogoService.ts`: `listarModelosEvaluacion()` | `src/services/catalogoService.ts` | ⬜ |

### **Fase 5: ModeloEvaluacion UI (Admin)**
| Tarea | Archivos | Estado |
|------|-----|--------|
| 5.1 `modeloService.ts` | `src/services/modeloService.ts` | ⬜ |
| 5.2 Página `ModelosPage.tsx` (o integrar en CursosPage) | `src/features/admin/pages/ModelosPage.tsx` | ⬜ |
| 5.2 Rutas en `App.tsx` + nav en `navigation.ts` | `src/App.tsx`, `src/config/navigation.ts` | ⬜ |

### **Fase 6: Mejoras Menores**
| Tarea | Archivos | Estado |
|------|-----|--------|
| 6.1 Examen `estado` editable en UI | `CalificacionesPage.tsx`, `examenes.service.ts` | ⬜ |
| 6.2 Endpoint `/api/resultados/:alumnoId` → UI ver resultado alumno individual | `CalificacionesPage.tsx` | ⬜ |
| 6.3 (Opcional) UI `AsignacionCurso` independiente | Nuevo feature `AsignacionesPage` | ⬜ |

---

## Distribución de Subagentes

### **Subagente A - Backend Core (Fases 1-3)**
- `configuracion.service.ts`, `competencia.service.ts`, `modelo.service.ts`
- `configuracion.ts`, `competencia.ts`, `modelo.ts` routers
- `cursogrado.service.ts` (auto-creación)
- `schemas.ts`, `app.ts`
- Verificación: `npx tsc -b`, smoke tests API

### **Subagente B - Frontend Config/Competencias (Fase 4)**
- `configuracionService.ts`, `competenciaService.ts`, `modeloService.ts`
- `CursosPage.tsx`: nueva tab "Config. Evaluación" + sub-tab "Competencias"
- `catalogoService.ts`: `listarModelosEvaluacion()`
- Verificación: `npx tsc -b`, `npm run build`, `npm run lint`

### **Subagente C - Admin ModeloEvaluacion + Mejoras (Fases 5-6)**
- `modeloService.ts`, `ModelosPage.tsx` (o integrar en CursosPage)
- `App.tsx`, `navigation.ts` rutas
- Mejoras menores: Examen estado editable, resultado alumno individual
- Verificación: `npx tsc -b`, `npm run build`, `npm run lint`

---

## Reglas para Subagentes

1. **NO modificar** archivos fuera de su ámbito asignado
2. **NO inventar endpoints** — usar patrones existentes (`apiFetch`, `ResultadoServicio`, `exigirAuth`, `exigirPermiso`, `validarCuerpo`)
3. **Reutilizar** componentes UI existentes (`Dialog`, `Select`, `Table`, `Badge`, `Can`, `PageHeader`, `FilasSkeleton`)
4. **Verificar** `npx tsc -b`, `npm run build`, `npm run lint` antes de terminar
4. **Smoke tests** API reales contra BD limpia antes de reportar completado

---

## Orden de Ejecución

```
1. Subagente A (Backend Fases 1-3) → COMPLETA antes de 
2. Subagente B (Frontend Fase 4) + Subagente C (Fases 5-6) EN PARALELO
```

---

## Verificación Final

```bash
npx tsc -b --force
npm run build
npm run lint
# Smoke tests E2E contra BD limpia
```

---

## Notas de Diseño

- **Permisos**: Reutilizar existentes (`cursos.ver/crear/editar/eliminar`, `grados.ver/crear/editar/eliminar`, `notas.registrar`, `competencias.gestionar` — nuevo permiso catálogo)
- **Catálogo**: `catalogoService` ya expone `listarGrados()`, `listarSeccionesDeGrado()`, `listarCursos()`, `listarDocentes()`, `listarPeriodoActivo()`. Agregar `listarModelosEvaluacion()`.
- **Patrón UI**: Seguir `CursosPage.tsx` (tabs), `CalificacionesPage.tsx` (dialogs, Can, FilasSkeleton, Alert+Reintentar).
- **Permisos catálogo**: `competencias.gestionar` (nuevo) o reutilizar `cursos.crear/editar` para configuración, `notas.registrar` para competencias.