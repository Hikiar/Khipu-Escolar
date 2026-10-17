# Modelo de Datos — Sistema de Gestión Escolar (Fase 2)

> **Estado:** Especificación de referencia; el modelo relacional se implementa y
> mantiene en `server/db/schema.ts` (espejo 1:1 de este documento, SQLite + Drizzle).
> **Alcance:** Análisis y diseño que guía la implementación en `server/`.
> **Regla:** La implementación RBAC de la Fase 1 y el código en `server/` y `src/`
> son la fuente de verdad del acceso; este documento describe el modelo conceptual.

---

## 1. Propósito

Definir el modelo de datos conceptual del sistema de gestión escolar: entidades,
relaciones, cardinalidades, restricciones y reglas de negocio necesarias para
soportar los módulos de alumnos, profesores, cursos, grados, matrículas,
asistencia, calificaciones, pagos y reportes, sobre la arquitectura RBAC ya
implementada.

El documento es la especificación de referencia para la Fase 3 (modelo
relacional/ORM y servicios), sin comprometer todavía motor de base de datos ni
flujos administrativos definitivos.

---

## 2. Diagrama ER conceptual

```
                      ┌─────────────────────── RBAC (Fase 1) ───────────────────────┐
                      │                                                             │
                      │  Persona 1 ── 0..1 Usuario 1 ─ N UsuarioRol N ─ 1 Rol N ─ M Permiso
                      │                   │                           │             │
                      │                   └── 0..N UsuarioPermisoAdicional      RolPermiso
                      └─────────────────────────────────────────────────────────────┘

Persona 1 ── 0..1 Alumno        1 ─ N Matricula ─ N 1 Clase
Persona 1 ── 0..1 Docente       1 ─ N AsignacionCurso ─ N 1 Clase
Docente N ── M NivelCurricular  (vía DocenteNivel: niveles donde dicta; multi-nivel)
Persona 1 ── 0..1 Apoderado     ── (AlumnoApoderado N ─ M Alumno)

PeriodoAcademico 1 ─ N Clase    (Grado 1 ─ N Seccion 1 ─ N Clase)   ← "1ro A — 2026"
PeriodoAcademico 1 ─ N Matricula
Grado          1 ─ N Clase
Seccion        1 ─ N Clase

Grado N ─ M Curso               (CursoGrado: plan de estudios del grado)
Curso 1 ─ N AsignacionCurso     Docente 1 ─ N AsignacionCurso
Clase 1 ─ N AsignacionCurso     ← docente dicta un curso EN una clase (varios permitidos)

Clase 1 ─ N Asistencia 1 ─ N AsistenciaDetalle ─ N 1 Alumno
        (AULA: cursoId NULL — tutor | CURSO: cursoId fijado — docente asignado)

Evaluación (configurable por Curso + Grado + Periodo)
Curso 1 ─ N ConfiguracionEvaluacionCurso N ─ 1 ModeloEvaluacion
Grado 1 ─ N ConfiguracionEvaluacionCurso        (COMPETENCIAS / EXAMEN / PERSONALIZADO)
PeriodoAcademico 1 ─ N ConfiguracionEvaluacionCurso

COMPETENCIAS
ConfiguracionEvaluacionCurso 1 ─ N CompetenciaCurso   ← compartida por las secciones del grado
CompetenciaCurso 1 ─ N TrabajoEvaluacion N ─ 1 Clase  ← trabajos propios de cada sección
TrabajoEvaluacion 1 ─ N CalificacionTrabajo ─ N 1 Alumno

EXAMEN (examen único)
ConfiguracionEvaluacionCurso 1 ─ N ExamenCurso N ─ 1 Clase   ← a lo sumo 1 por (config, clase)
ExamenCurso 1 ─ N CalificacionExamen ─ N 1 Alumno

PeriodoAcademico 1 ─ N ConceptoPago 1 ─ N Pago ─ N 1 Alumno
Pago.registradoPor ─ 1 Usuario        (auditoría también en Matricula/CalificacionTrabajo/CalificacionExamen/Asistencia)
```

---

## 3. Entidades, atributos, PK/FK y restricciones

Notación: **PK** = clave primaria · **FK** = clave foránea · **UQ** = campo/clave única.

### 3.1 — RBAC (se conserva tal cual la Fase 1)

| Entidad | Propósito | PK | FKs | UQ | Atributos clave |
|---|---|---|---|---|---|
| `Persona` | Base de toda persona física | `id` | — | `dni`, `codigoInstitucional` | nombres, apellidos, correo?, telefono?, fechaNacimiento?, sexo?, direccion?; `codigoInstitucional` = `[LETRA][AÑO 2D][CORRELATIVO 6D]` (E/P/D/S/A), permanente y no reutilizable |
| `Usuario` | Cuenta de acceso | `id` | `personaId` | `username` | activo, `rolIds[]`, `permisosAdicionales[]` (futuro), createdAt, desactivadoAt? |
| `Rol` | Plantilla de permisos **configurable** | `id` | — | `codigo` | nombre, descripcion, activo, `permisos[]` |
| `Permiso` | Código `modulo.accion` | `id` | — | `codigo` | modulo, descripcion |
| `RolPermiso` | Relación N–M Rol↔Permiso | `(rolId, permisoId)` | rolId, permisoId | compuesta | — |
| `UsuarioRol` | Relación N–M Usuario↔Rol (normalización futura del array `rolIds`) | `(usuarioId, rolId)` | ambos | compuesta | — |
| `UsuarioPermisoAdicional` | PREPARACIÓN futura (no implementar) | `(usuarioId, permisoId)` | ambos | compuesta | — |

> Concepto: `Persona → Usuario → Rol → Permisos`. Los roles NO son rígidos: son
> plantillas que la fase siguiente podrá crear/editar/renombrar/activar.

### 3.2 — Académicas

| Entidad | Propósito | PK | FKs | UQ | Atributos clave |
|---|---|---|---|---|---|
| `Alumno` | Estudiante (subtipo de Persona) | `personaId` (PK/FK) | personaId | `codigoInstitucional` | ingresoAt, estado (ACTIVO/RETIRADO/EGRESADO) |
| `Docente` | Profesor (subtipo de Persona) | `personaId` (PK/FK) | personaId | — | especialidad?, titulo?, ingresoAt, estado (ACTIVO/LICENCIA/INACTIVO), `niveles[]` (INICIAL/PRIMARIA/SECUNDARIA, vía `DocenteNivel`) |
| `DocenteNivel` | Niveles curriculares donde dicta el docente (EF/Arte/Inglés dictan en varios) | `(docenteId, nivel)` | docenteId | compuesta | `nivel` (INICIAL/PRIMARIA/SECUNDARIA); ≥1 por docente al crear/editar |
| `Apoderado` | Tutor/padre (subtipo de Persona) | `personaId` (PK/FK) | personaId | — | parentesco (PADRE/MADRE/TUTOR), esContactoEmergencia |
| `AlumnoApoderado` | Un alumno puede tener varios tutores | `(alumnoId, apoderadoId)` | ambos | compuesta | parentesco, prioridad |
| `PeriodoAcademico` | Año lectivo | `id` | — | `codigo` | nombre, fechaInicio, fechaFin, estado (PLANIFICADO/ACTIVO/CERRADO), `bandasLiteral[]` |
| `Grado` | Nivel académico (1ro Primaria…) | `id` | — | `codigo` | nombre, nivel (INICIAL/PRIMARIA/SECUNDARIA), orden |
| `Seccion` | Grupo dentro del grado ("A") | `id` | `gradoId` | `(gradoId, nombre)` | nombre, turno (MAÑANA/TARDE) |
| `Clase` | **Entidad central**: grupo real del año `Periodo+Grado+Seccion` | `id` | `periodoId`, `gradoId`, `seccionId`, `tutorDocenteId?` | `(periodoId, gradoId, seccionId)` | estado (ABIERTA/CERRADA), vacantes |
| `Matricula` | Única inscripción de un Alumno en una Clase dentro de un PeriodoAcademico | `id` | `alumnoId→Alumno`, `claseId→Clase`, `periodoId→PeriodoAcademico`, `registradoPor→Usuario` | parcial `(alumnoId, periodoId)` donde estado = ACTIVA (N1) | fechaRegistro, estado (ACTIVA/RETIRADA), retiradoAt?, observaciones? |
| `Curso` | Catálogo de materias | `id` | — | `codigo` | nombre, descripcion?, activo |
| `CursoGrado` | Plan de estudios del grado | `(cursoId, gradoId)` | ambos | compuesta | horasSemana?, orden? |
| `AsignacionCurso` | **Intermedia**: qué docente dicta qué curso en qué Clase | `(claseId, cursoId, docenteId)` | claseId, cursoId, docenteId | compuesta | — |

> El catálogo `Curso` incluye las áreas CNEB del plan de estudios y **`TUT-01 Tutoría`**
> (TOE), que se dicta solo en SECUNDARIA (`horasSemana=1`) con `CursoGrado` para esos
> grados; el tutor de aula se lo asigna vía `AsignacionCurso` como a cualquier materia.

> `Matricula.periodoId` es **redundante** con `Clase.periodoId` (derivable por Clase). Se
> mantiene de forma **consciente** en Fase 2 (decisión 15): sostiene la única parcial
> `(alumnoId, periodoId)` y las reglas N1/N3. La capa de servicios debe validar que
> `Matricula.periodoId == Clase.periodoId` al registrar o mover una matrícula.

### 3.3 — Asistencia (doble alcance)

| Entidad | Propósito | PK | FKs | UQ | Atributos clave |
|---|---|---|---|---|---|
| `Asistencia` | Registro diario de una Clase con **alcance** AULA o CURSO | `id` | `claseId`, `cursoId?` (solo CURSO), `registradoPor→Usuario` | parcial `(claseId, fecha)` donde `cursoId IS NULL` (AULA); parcial `(claseId, cursoId, fecha)` donde `cursoId IS NOT NULL` (CURSO) | fecha, observaciones |
| `AsistenciaDetalle` | Estado diario de cada alumno | `id` | `asistenciaId`, `alumnoId` | `(asistenciaId, alumnoId)` | estado (PRESENTE/TARDE/FALTA/JUSTIFICADO), horaEntrada?, horaSalida?, observaciones? |

> **Alcances** (`cursoId`): `NULL` = asistencia general del aula, la registra el **tutor de la
> Clase** (`clases.tutorDocenteId`, o un administrador) — es la opción normal en Inicial/Primaria.
> Con `cursoId` fijado = asistencia de un curso concreto, la registra el **docente con
> `AsignacionCurso(claseId, cursoId)`** (o administrador) — el caso de los especialistas
> (Psicomotriz en Inicial, EF/Inglés/Arte en Primaria) y de todos los cursos en Secundaria.
> Ambos alcances conviven el mismo día; la capacidad sale de las **relaciones**, nunca de
> reglas por nivel.

### 3.4 — Evaluación (modelo configurable por curso)

> Sustituye al modelo anterior `TipoEvaluacion` → `EvaluacionCurso` → `Calificacion` (descartado).
> La configuración es por **Curso + Grado + Periodo**; las competencias se comparten entre las
> secciones del grado, pero los trabajos/exámenes y sus calificaciones son **por Clase**.

| Entidad | Propósito | PK | FKs | UQ | Atributos clave |
|---|---|---|---|---|---|
| `ModeloEvaluacion` | Catálogo extensible de modelos de evaluación | `id` | — | `codigo` | nombre, descripcion, activo |
| `ConfiguracionEvaluacionCurso` | Decide el modelo con que se evalúa un curso en un grado y periodo | `id` | `cursoId`, `gradoId`, `periodoId`, `modeloEvaluacionId` | `(cursoId, gradoId, periodoId)` | activo |
| `CompetenciaCurso` | Competencia definida por el Director (solo en modelo COMPETENCIAS); compartida por las secciones del grado | `id` | `configuracionEvaluacionCursoId` | `(configuracionId, codigo)` | nombre, descripcion?, orden, activo |
| `TrabajoEvaluacion` | Trabajo/evidencia creado por el Profesor dentro de una competencia, para una Clase concreta; dinámico (N por competencia) | `id` | `claseId`, `competenciaCursoId` | — | nombre, descripcion?, fecha, activo? |
| `CalificacionTrabajo` | Nota real de un alumno en un trabajo de su Clase | `id` | `trabajoEvaluacionId`, `alumnoId`, `registradoPor→Usuario` | `(trabajoEvaluacionId, alumnoId)` | nota (decimal 0–20, 2 decimales), fechaRegistro, observaciones? |
| `ExamenCurso` | Examen único del modelo EXAMEN, por Clase; a lo sumo 1 por `(configuración, clase)` | `id` | `claseId`, `configuracionEvaluacionCursoId` | `(claseId, configuracionId)` | nombre, fecha, estado |
| `CalificacionExamen` | Nota real de un alumno en el examen único de su Clase | `id` | `examenCursoId`, `alumnoId`, `registradoPor→Usuario` | `(examenCursoId, alumnoId)` | nota (decimal 0–20, 2 decimales), fechaRegistro, observaciones? |

### 3.5 — Pagos

| Entidad | Propósito | PK | FKs | UQ | Atributos clave |
|---|---|---|---|---|---|
| `ConceptoPago` | Cronograma (Matrícula, Pensión marzo…) | `id` | `periodoId` | `(periodoId, codigo)` | descripcion, tipo (MATRICULA/PENSION/OTRO), montoBase, fechaVencimiento?, obligatorio |
| `Pago` | Pago concreto de un alumno | `id` | `alumnoId`, `conceptoId`, `registradoPor→Usuario` | `(alumnoId, conceptoId)` | monto, metodoPago (EFECTIVO/TRANSFERENCIA/TARJETA), referencia?, fecha, estado (REGISTRADO/ANULADO), observaciones? |

> `reportes` y `dashboard` no modelan entidades: son consultas sobre las anteriores.

---

## 4. Cardinalidades

```
RBAC
Persona 1 ─── 0..1 Usuario
Usuario N ─── N Rol                          (vía UsuarioRol)
Rol N ─── N Permiso                          (vía RolPermiso)
Usuario 1 ─── 0..N PermisoAdicional          (futuro)
Persona 1 ─── 0..1 Alumno | Docente | Apoderado

Académico
Alumno 1 ─── N Matricula                     Clase 1 ─── N Matricula
PeriodoAcademico 1 ─── N Matricula
PeriodoAcademico 1 ─── N Clase               Grado 1 ─── N Clase
Seccion 1 ─── N Clase                        Grado 1 ─── N Seccion
Docente 1 ─── N AsignacionCurso              Curso 1 ─── N AsignacionCurso
Clase 1 ─── N AsignacionCurso                Grado N ─── M Curso (vía CursoGrado)
Docente N ─── M NivelCurricular              (vía DocenteNivel)
Alumno N ─── M Apoderado                     (vía AlumnoApoderado)

Asistencia
Clase 1 ─── N Asistencia 1 ─── N AsistenciaDetalle ─── N 1 Alumno
Asistencia (AULA): Clase 1 ─── N            (cursoId NULL)
Asistencia (CURSO): Clase 1 ─── N, Curso 1 ─── N   (cursoId fijado)

Evaluación (configurable)
Curso 1 ─── N ConfiguracionEvaluacionCurso   Grado 1 ─── N ConfiguracionEvaluacionCurso
PeriodoAcademico 1 ─── N ConfiguracionEvaluacionCurso
ConfiguracionEvaluacionCurso N ─── 1 ModeloEvaluacion

COMPETENCIAS
ConfiguracionEvaluacionCurso 1 ─── N CompetenciaCurso
CompetenciaCurso 1 ─── N TrabajoEvaluacion  Clase 1 ─── N TrabajoEvaluacion
TrabajoEvaluacion 1 ─── N CalificacionTrabajo
Alumno 1 ─── N CalificacionTrabajo

EXAMEN (examen único)
ConfiguracionEvaluacionCurso 1 ─── N ExamenCurso   Clase 1 ─── N ExamenCurso
ExamenCurso 1 ─── N CalificacionExamen
Alumno 1 ─── N CalificacionExamen

Pagos
PeriodoAcademico 1 ─── N ConceptoPago 1 ─── N Pago ─── N 1 Alumno

Auditoría
Usuario 1 ─── N (Matricula.registradoPor, Pago.registradoPor,
                 CalificacionTrabajo.registradoPor, CalificacionExamen.registradoPor,
                 Asistencia.registradoPor)
```

### Justificación de las relaciones no obvias

1. **`Clase` central (Periodo+Grado+Seccion).** Evita repetir `(periodoId, gradoId,
   seccionId)` en Matricula, AsignacionCurso, Asistencia, TrabajoEvaluacion y
   ExamenCurso. Todas las operaciones académicas cuelgan de un grupo estable por año.
2. **Subtipos `Alumno`/`Docente`/`Apoderado` de `Persona` (1:0..1).** Núcleo único
   (DNI, contacto) + extensiones con solo sus atributos; evita columnas nulas
   masivas y permite que una misma Persona sea, p. ej., docente y apoderado.
3. **`AsignacionCurso` intermedia con múltiples docentes.** El dictado es
   tridimensional (docente × curso × Clase) y existe solo durante el año de esa
   composición. PK `(claseId, cursoId, docenteId)` admite N docentes sin
   duplicados.
4. **Modelo de evaluación configurable.** `ConfiguracionEvaluacionCurso (curso, grado,
   periodo)` decide el `ModeloEvaluacion`; un mismo curso puede cambiar de modelo entre
   periodos sin tocar el catálogo `Curso`.
5. **Asistencia con doble alcance (AULA y CURSO).** `Asistencia.cursoId` `NULL` = asistencia
   general del aula (la registra el tutor de la Clase); con `cursoId` fijado = asistencia de un
   curso concreto (la registra el docente con `AsignacionCurso`). Ambos alcances conviven el
   mismo día mediante índices parciales (N6) y su capacidad (quién puede registrar qué) sale de
   las **relaciones** (`tutorDocenteId` / `AsignacionCurso`), sin reglas codificadas por nivel.
6. **`ConceptoPago` separado de `Pago`**: cronograma ≠ hecho. `(alumnoId,
   conceptoId)` evita cobrar dos veces el mismo concepto en el periodo.
7. **Competencias compartidas por grado; actividades por Clase.** `CompetenciaCurso`
   cuelga de la configuración (3° A y 3° B comparten competencias), pero
   `TrabajoEvaluacion`/`ExamenCurso` cuelgan de la `Clase`: cada sección tiene sus
   propios trabajos y calificaciones.

---

## 5. Escala numérica y nivel de logro AD/A/B/C

- Toda nota (`CalificacionTrabajo.nota`, `CalificacionExamen.nota`): decimal **0–20 con 2 decimales**.
- La escala numérica y el nivel de logro (**AD/A/B/C**) son **dimensiones distintas**:
  no se fuerza una conversión automática nota → letra.
- El nivel de logro se **deriva** por bandas y NO se almacena.
- Bandas **configurables por institución/periodo** (`PeriodoAcademico.bandasLiteral[]`).
- Propuesta inicial CNEB (configurable, no universal):

| Literal | Rango |
|---|---|
| C | 0 – 10 |
| B | 11 – 13 |
| A | 14 – 17 |
| AD | 18 – 20 |

---

## 6. Reglas de integridad de datos (P0)

| # | Regla |
|---|---|
| I1 | `dni` único en `Persona` |
| I2 | `username` único en `Usuario`; 1 Usuario ↔ 1 Persona |
| I3 | Un usuario inactivo (`activo = false`) no puede iniciar sesión |
| I4 | Una matrícula exige alumno y Clase existentes, con Clase ABIERTA |
| I5 | `AsistenciaDetalle` solo para alumnos con matrícula ACTIVA en esa Clase/periodo |
| I6 | `CalificacionTrabajo`/`CalificacionExamen` solo para alumnos con matrícula ACTIVA en la `Clase` de ese periodo |
| I7 | Toda entidad transaccional lleva `registradoPor` (Usuario) no nulo |
| I8 | Una sola calificación por `(trabajo, alumno)` y por `(examen, alumno)` (UQ compuesta) |

---

## 7. Reglas de negocio (dominio)

| # | Regla | Prioridad |
|---|---|---|
| N1 | Un alumno NO tiene dos matrículas activas en el mismo periodo (única parcial sobre `(alumnoId, periodoId)` donde estado = ACTIVA; una matrícula RETIRADA libera la unicidad y permite una nueva) | P0 |
| N2 | Solo un `PeriodoAcademico` puede estar en estado ACTIVO | P0 |
| N3 | Las matrículas ACTIVAS de una Clase no exceden su `vacantes` | P0 |
| N4 | Un concepto de pago se cobra una vez por alumno/periodo; anular el pago libera el concepto | P0 |
| N5 | Un docente registra asistencia de **AULA** solo como tutor de la Clase (`tutorDocenteId`) y de **CURSO** solo donde tiene `AsignacionCurso`; crea/modifica trabajos y exámenes y registra calificaciones solo en las Clases+Curso donde tiene `AsignacionCurso` (el administrador `*` puede todo) | P1 |
| N6 | Asistencia: un registro **por alcance** — `(clase, fecha)` en AULA y `(clase, curso, fecha)` en CURSO (índices parciales); cada alumno una sola vez ese día por registro | P1 |
| N7 | `nota` dentro de 0–20 (2 decimales); el nivel de logro se deriva de bandas configurables, sin conversión automática | P1 |
| N8 | Retirar a un alumno ⇒ matrícula → RETIRADA (el historial se conserva) | P1 |
| N9 | Anular matrícula solo si no tiene calificaciones ni pagos asociados | P2 |
| N10 | Cerrar un periodo congela matrículas, asistencia y notas (solo lectura) | P2 |
| N11 | Los trabajos son dinámicos: no existen columnas fijas (`PC1`, `PC2`, `nota1`…); el profesor crea los que necesite dentro de una competencia | P1 |
| N12 | En modelo EXAMEN existe a lo sumo un `ExamenCurso` por `(configuración, Clase)` | P1 |
| N13 | Promedio de competencia y resultado del curso son SIEMPRE derivados (cálculo), nunca almacenados | P1 |
| N14 | Resultado final: en COMPETENCIAS se deriva de las competencias (regla configurable; default: promedio simple); en EXAMEN es la nota del examen único | P2 |

---

## 8. Reglas de autorización RBAC (P0 — Fase 1, sin cambios)

| # | Regla |
|---|---|
| A1 | El acceso se decide SIEMPRE por `can('modulo.accion')`, nunca por el nombre del rol |
| A2 | `usuario.permisos` = unión de permisos de sus roles activos (+ `permisosAdicionales` cuando existan) |
| A3 | El wildcard `*` (Director) concede todos los permisos |
| A4 | La restricción de dominio N5 (docente solo sus asignaciones) se aplica en la capa de servicio, no en UI |
| A5 | `roles.gestionar` habilita la futura administración de roles/permisos; `usuarios.gestionar`, la de cuentas |
| A6 | Roles como plantillas configurables: crear/editar/renombrar/activar/desactivar y asignar/quitar permisos (fase futura, NO implementada) |
| A7 | Permisos propuestos (`competencias.gestionar`, `evaluaciones.crear`, `evaluaciones.editar`, `calificaciones.registrar`) quedan **documentados como pendiente de Fase 3**; el catálogo RBAC vigente NO se modifica |

---

## 9. Decisiones tomadas (Fase 2)

1. `Persona` base con subtipos `Alumno`, `Docente`, `Apoderado` (1:0..1).
2. `Clase` como entidad central (Periodo + Grado + Sección); nuevo año ⇒ nueva Clase.
3. `AsignacionCurso` con **múltiples docentes** por (Clase, Curso).
4. Asistencia: `Asistencia` + `AsistenciaDetalle`, por sección/día por alumno.
5. Evaluación configurable: `ConfiguracionEvaluacionCurso (curso, grado, periodo)` → `ModeloEvaluacion` (COMPETENCIAS / EXAMEN / PERSONALIZADO).
6. En COMPETENCIAS: el Director define `CompetenciaCurso` (compartidas por las secciones del grado); el Profesor crea `TrabajoEvaluacion` dinámicos **por Clase** y califica con `CalificacionTrabajo`.
7. En EXAMEN: examen único por Clase (`ExamenCurso`, máx. 1 por `(configuración, clase)`) con `CalificacionExamen` por alumno.
8. En PERSONALIZADO: el modelo queda **preparado para extensibilidad futura**, sin implementar.
9. Trabajos dinámicos: no hay columnas fijas (`PC1`, `PC2`, `nota1`…); los nombres son atributos.
10. Promedios (competencia, resultado de curso) y nivel de logro AD/A/B/C son **derivados**, nunca almacenados.
11. Bandas configurables por institución/periodo; inicial CNEB C 0–10 · B 11–13 · A 14–17 · AD 18–20 (no universal).
12. RBAC de la Fase 1 se conserva: sin cambios conceptuales; roles como plantillas.
13. Auditoría `registradoPor` (Usuario) en transacciones.
14. Reportes = consultas; no entidades propias.
15. Se mantiene `Matricula.periodoId` como **redundancia controlada** de `Clase.periodoId` (derivable); no se elimina en Fase 2 para no alterar N1/N3 y el resto del modelo. La consistencia la valida la capa de servicios.
16. **Docente multi-nivel**: `DocenteNivel` (`docenteId, nivel`) modela los niveles curriculares donde dicta cada docente (≥1 al crear/editar); un docente de EF/Arte/Inglés puede dictar en varios niveles. Sirve para filtrar tutores/asignaciones por nivel y para el cuadro de carga futura.
17. **Asistencia de doble alcance** (AULA + CURSO): `Asistencia.cursoId` nullable con índices parciales; la regla de quién registra se deriva de las relaciones (tutor → AULA; `AsignacionCurso` → CURSO), sin ramas por nivel en el código.
18. **Tutoría en Secundaria** como curso del catálogo (`TUT-01`, TOE, `horasSemana=1`, solo grados SECUNDARIA) que el tutor de aula se asigna vía `AsignacionCurso`; su asistencia y (fase futura) comportamiento salen de la misma lógica de asignación.

---

## 10. Decisiones pendientes (Fase 3 — no bloquear el modelo)

1. Confirmar las **bandas literales definitivas** (CNEB vs ajuste institucional).
2. **Apoderado/contacto de emergencia**: ¿obligatorio mínimo 1 al matricular o dato libre?
3. **Pagos**: ¿solo estados REGISTRADO/ANULADO o admitir PENDIENTE/parcialidades?
4. Confirmar que **cada nuevo periodo genera una nueva `Clase`** (sí por diseño; ratificar reglas de vacantes/reinscripción).
5. **Motor de base de datos** (PostgreSQL como sugerencia; no se decide ahora).
6. Flujo administrativo de usuarios/roles (crear usuario→rol vs rol→usuario; cambio de rol, desactivar, roles personalizados) — se diseñará sin rehacer el RBAC.
7. **Regla del resultado final del curso** en COMPETENCIAS (default: promedio simple; ¿ponderación/redondeo?).
8. **Catálogo inicial de competencias** por curso (referencial MINEDU) o comenzar vacío.
9. **Permisos nuevos** (`competencias.gestionar`, `evaluaciones.crear`, `evaluaciones.editar`, `calificaciones.registrar`) a incorporar al RBAC en Fase 3.

---

## 11. Arquitectura futura (Fase 3 en adelante)

```
React (features/.../pages + components)
        │  consume resultados ADT `ResultadoServicio` (ya existe)
        ▼
src/services/*          ◄── HOY: mocks en memoria, firmas tipo API
        │  se reemplaza SOLO la implementación interna (mockData → HTTP), no los callers
        ▼
API Node.js (Express/Fastify) + validación (Zod)
        │  contrato tipado compartido (reutiliza @/types/rbac, @/types/auth, permisos.catalog)
        ▼
Services (reglas de dominio N1–N14 e integridad I1–I8)
        ▼
Repository / ORM (Prisma, Drizzle o TypeORM)
        ▼
Base de datos (motor por decidir; PostgreSQL recomendado)
```

Principios de la futura migración:

- Los tipos RBAC, el catálogo de permisos y `@/lib/authorization` pasan a una
  capa de **contratos compartidos** reutilizable entre frontend y API.
- Los servicios de frontend mantienen la **misma interfaz ADT**, por lo que el
  frontend **no se rehace**: solo la capa interna de `src/services/*` cambia de
  mock a llamadas HTTP.
- La validación de reglas de negocio vive en el backend (services), nunca en UI.

---

## 12. Mapa de módulos existentes → entidades

| Módulo (permiso) | Entidades involucradas |
|---|---|
| Dashboard | Consultas agregadas sobre todas |
| Alumnos (`alumnos.*`) | Persona, Alumno, AlumnoApoderado, Apoderado |
| Profesores (`profesores.*`) | Persona, Docente, DocenteNivel, AsignacionCurso |
| Cursos (`cursos.*`) | Curso, CursoGrado |
| Grados (`grados.*`) | Grado, Seccion, Clase |
| Matrículas (`matriculas.*`) | Matricula, Clase, PeriodoAcademico, Alumno |
| Asistencia (`asistencia.*`) | Asistencia, AsistenciaDetalle, Clase, Curso |
| Calificaciones (`notas.*`) | ConfiguracionEvaluacionCurso, ModeloEvaluacion, CompetenciaCurso, TrabajoEvaluacion, CalificacionTrabajo, ExamenCurso, CalificacionExamen, Clase, Curso |
| Pagos (`pagos.*`) | Pago, ConceptoPago, PeriodoAcademico, Alumno |
| Reportes (`reportes.*`) | Consultas (activas en Fase 3) |
| Usuarios/Roles (admin) | Persona, Usuario, Rol, Permiso, RolPermiso, UsuarioRol |

---

## 13. Modelo de evaluación configurable

### 13.1 Estructura

```
Curso
└── ConfiguracionEvaluacionCurso (Curso + Grado + Periodo)
    ├── Modelo COMPETENCIAS
    │   └── CompetenciaCurso (1..N)                      ← compartida por 3° A y 3° B
    │       └── TrabajoEvaluacion (0..N, POR CLASE)      ← trabajos propios de la sección
    │           └── CalificacionTrabajo → Alumno
    ├── Modelo EXAMEN
    │   └── ExamenCurso (1 por CLASE, N por config)              ← a lo sumo 1 por (config, clase)
    │       └── CalificacionExamen → Alumno
    └── Modelo PERSONALIZADO (extensible en el futuro, sin implementar)
```

### 13.2 Flujo: Director → Competencia → Profesor → Trabajo → Calificación

1. El **Director** elige el `ModeloEvaluacion` por `(curso, grado, periodo)` y, en
   COMPETENCIAS, crea las `CompetenciaCurso` (compartidas por todas las secciones del
   grado). No crea evidencias.
2. El **Profesor**, dentro de una competencia y **solo en la Clase donde tiene
   `AsignacionCurso`**, crea `TrabajoEvaluacion` dinámicos (trabajos/evidencias, nombres
   como atributos, N por competencia).
3. El **Profesor** califica a cada alumno con `CalificacionTrabajo` (una por
   `(trabajo, alumno)`), con trazabilidad (`registradoPor`, `fechaRegistro`, `observaciones`).
4. El **Sistema** deriva (nunca almacena): promedio de competencia = promedio simple de sus
   trabajos; resultado del curso = regla configurable (default: promedio de competencias).
   El nivel de logro AD/A/B/C se deriva por bandas configurables.

### 13.3 Modelo EXAMEN (examen único)

- Un único `ExamenCurso` por `(configuración, Clase)`; un modelo posterior con varios
  exámenes no rediseña la arquitectura (se relajaría `1 → N`).
- El resultado del curso **es** la nota del `CalificacionExamen` del alumno.

### 13.4 Modelo PERSONALIZADO

- Solo deja preparada la extensibilidad del catálogo `ModeloEvaluacion`; no se define
  su estructura ahora.

### 13.5 Responsabilidades: Director / Profesor / Sistema

| Actor | Compete | Entidades |
|---|---|---|
| **DIRECTOR** | Elegir modelo por `(curso, grado, periodo)`; crear/editar/activar competencias | `ConfiguracionEvaluacionCurso`, `CompetenciaCurso` |
| **PROFESOR** | Ver solo sus asignaciones; crear/editar trabajos; registrar calificaciones | `TrabajoEvaluacion`, `CalificacionTrabajo`, `ExamenCurso`, `CalificacionExamen` |
| **SISTEMA** | Derivar promedios, resultado del curso y nivel de logro; validar dominio (`AsignacionCurso`); trazabilidad | — (cálculos y consultas) |

> La restricción de dominio del Profesor se aplica en la **capa de servicio** validando su
> `AsignacionCurso` (Clase + Curso), no solo ocultando botones en la UI. Permisos nuevos
> (`competencias.gestionar`, `evaluaciones.crear`, `evaluaciones.editar`,
> `calificaciones.registrar`) quedan documentados como **pendiente de Fase 3**.

### 13.6 Coherencia: configuración, competencia, clase, trabajo y examen

Reglas de coherencia de dominio que la capa de servicios/backend debe validar al crear o
editar `TrabajoEvaluacion` y `ExamenCurso`. Son **conceptuales/documentales** y respetan
la integridad por relación, sin FKs redundantes: no se agregan columnas `cursoId`, `gradoId`
ni `periodoId` a estas entidades.

**`TrabajoEvaluacion` → competencia + Clase compatible**

- `TrabajoEvaluacion.claseId` debe ser compatible con la `ConfiguracionEvaluacionCurso`
  de su `CompetenciaCurso` (`competenciaCursoId` → `configuracionEvaluacionCursoId`):
  misma **unidad (curso, grado, periodo)**.
  - La Clase pertenece al `(grado, periodo)` de la configuración.
  - El curso de la competencia es el `cursoId` de la configuración y pertenece al plan del
    grado de la Clase (`CursoGrado`).
- No debe ser posible asociar una competencia de Matemática de 3.º grado/Periodo 1 con una
  Clase de Comunicación de 4.º grado/Periodo 2.
- El docente debe tener `AsignacionCurso` para `(claseId, cursoId)` (N5) para poder crear,
  editar o calificar trabajos en esa Clase.

**`ExamenCurso` → configuración + Clase compatible**

- `ExamenCurso.claseId` debe ser compatible con `ExamenCurso.configuracionEvaluacionCursoId`:
  misma **unidad (curso, grado, periodo)**.
- La `UQ (claseId, configuracionEvaluacionCursoId)` garantiza **un único examen por Clase y
  configuración** (N12). Una misma configuración puede tener **N `ExamenCurso`** (uno por
  Clase/sección).

> Estas reglas se validan en la capa de servicios, no en las tablas; mantienen el diseño
> aprobado (configuración por curso+grado+periodo) sin rediseñar entidades.