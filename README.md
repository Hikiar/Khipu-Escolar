# Khipu Escolar

Khipu Escolar es un sistema de gestión interna para colegios particulares del Perú, enfocado en inicial, primaria y secundaria. Organiza tareas escolares y administrativas cotidianas como la gestión de alumnos y de los datos de sus apoderados, docentes, grados y secciones, matrícula interna, asistencia, evaluación, pagos y reportes.

Khipu complementa el trabajo del colegio; no busca reemplazar SIAGIE ni cubrir sus procesos oficiales. Actualmente el proyecto está pensado para una institución. Su adaptación a otros colegios es una meta futura, todavía sin una decisión de despliegue multiinstitución.

## Tecnologías

- Frontend: React, TypeScript, Vite y Tailwind CSS.
- Backend: Node.js y Express.
- Persistencia: SQLite con Drizzle ORM.

## Desarrollo local

Requiere Node.js y npm instalados.

```bash
npm install
npm run dev
```

El comando `dev` inicia la API y el servidor de Vite. La API usa el puerto `8787` por defecto. En desarrollo, Vite muestra la dirección local en la terminal.

La base SQLite local se crea en `server/data/` al iniciar la API, y la semilla se aplica si la base está vacía. Los archivos de datos locales están excluidos de Git.

## Comandos disponibles

| Comando | Propósito |
|---|---|
| `npm run dev` | Inicia API y frontend para desarrollo. |
| `npm run build` | Compila TypeScript y genera el frontend de producción en `dist/`. |
| `npm run start` | Inicia la aplicación servida por la API. |
| `npm run lint` | Ejecuta Oxlint. |
| `npm run test:smoke` | Ejecuta verificaciones de humo contra una base temporal. |
| `npm run backup` | Crea un respaldo local de la base SQLite. |

Los respaldos, archivos `.env` y bases locales no deben incorporarse al repositorio. Para ajustar variables de entorno, consulta `.env.example` y usa un `.env` local.

## Documentación

- [Índice y estado de la documentación](docs/README.md)
- [Orientación y alcance del producto](docs/producto.md)
- [Referencia del modelo de datos](docs/modelo-datos.md)
- [Sistema de diseño](DESIGN_SYSTEM.md)
- [Plan de mejoras UX](plan-frontend-ux.md)

La documentación histórica se conserva por ahora para mantener el contexto de decisiones. El código vigente es la fuente de verdad cuando una descripción documental no coincide con la implementación.
