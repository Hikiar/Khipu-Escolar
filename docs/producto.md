# Khipu Escolar: orientación del producto

**Estado:** vigente  
**Actualizado:** 2026-10-17

## Propósito

Khipu Escolar es un sistema de gestión interna para colegios particulares del Perú que ofrecen educación inicial, primaria y secundaria. Busca apoyar la operación escolar cotidiana en un solo lugar: alumnos y datos de sus apoderados, docentes, organización académica, matrícula interna, asistencia, evaluación, pagos y reportes.

Está dirigido principalmente a dirección, secretaría, docentes y personal autorizado del colegio. Una interfaz para que las familias ingresen al sistema no forma parte de la capacidad actual.

## Alcance y límites

- Khipu complementa la gestión interna del colegio; no pretende reemplazar SIAGIE ni asumir sus procesos oficiales.
- El proyecto actual está diseñado para una institución y utiliza una base de datos local por instalación.
- Una posible adaptación y venta a otros colegios es una meta futura. Primero se deben identificar qué datos y reglas varían por institución y hacerlos configurables cuando tenga sentido.
- La decisión entre instalaciones separadas por colegio y un servicio compartido sigue pendiente. No se debe asumir ni implementar multiinstitución hasta tomar esa decisión.

## Criterios de evolución

1. Resolver necesidades reales del colegio objetivo antes de generalizar funciones para clientes hipotéticos.
2. Preferir configuración institucional a bifurcaciones de código por cada colegio.
3. Mantener separados los conceptos académicos —grado, sección y clase— de los ambientes físicos y horarios si estos se incorporan.
4. Tratar con cuidado la información personal de estudiantes y apoderados; usar datos ficticios en demos y pruebas.
5. Verificar el código vigente antes de tratar una tarea descrita en un plan antiguo como pendiente.

## Lo que este documento no define

Este alcance no decide todavía cómo se desplegará el producto para futuros colegios, qué módulos adicionales se venderán ni si habrá integraciones o exportaciones hacia sistemas externos. Esas decisiones requieren requisitos confirmados y una revisión técnica independiente.
