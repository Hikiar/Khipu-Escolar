/**
 * Catálogo referencial del Currículo Nacional de la Educación Básica (CNEB).
 * Áreas curriculares por nivel y sus competencias referenciales (MINEDU).
 * Se usa para:
 * - Sembrar cursos y su plan de estudios por nivel.
 * - Precargar competencias base al crear una configuración COMPETENCIAS.
 *
 * Los códigos de competencia (C01…) son por área+nivel y solo de referencia:
 * el Director puede editarlas, añadir más o quitarlas.
 */

export type NivelCurricular = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA'

export const NIVEL_LABELS: Record<NivelCurricular, string> = {
  INICIAL: 'Inicial',
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
}

export interface CompetenciaReferencial {
  codigo: string
  nombre: string
}

export interface AreaCneb {
  /** id estable del curso semillado */
  id: string
  /** código de curso (p. ej. MAT-01) */
  codigo: string
  nombre: string
  descripcion: string
  /** horas semanales por defecto en el plan */
  horasSemana: number
  /** competencias referenciales de cada nivel donde se dicta el área */
  niveles: Partial<Record<NivelCurricular, CompetenciaReferencial[]>>
}

export const AREAS_CNEB: AreaCneb[] = [
  {
    id: 'cur-mate',
    codigo: 'MAT-01',
    nombre: 'Matemática',
    descripcion: 'Área de Matemática',
    horasSemana: 4,
    niveles: {
      INICIAL: [
        { codigo: 'C01', nombre: 'Resuelve problemas de cantidad.' },
        { codigo: 'C02', nombre: 'Resuelve problemas de forma, movimiento y localización.' },
      ],
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Resuelve problemas de cantidad.' },
        { codigo: 'C02', nombre: 'Resuelve problemas de regularidad, equivalencia y cambio.' },
        { codigo: 'C03', nombre: 'Resuelve problemas de forma, movimiento y localización.' },
        { codigo: 'C04', nombre: 'Resuelve problemas de gestión de datos e incertidumbre.' },
      ],
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Resuelve problemas de cantidad.' },
        { codigo: 'C02', nombre: 'Resuelve problemas de regularidad, equivalencia y cambio.' },
        { codigo: 'C03', nombre: 'Resuelve problemas de forma, movimiento y localización.' },
        { codigo: 'C04', nombre: 'Resuelve problemas de gestión de datos e incertidumbre.' },
      ],
    },
  },
  {
    id: 'cur-com',
    codigo: 'COM-01',
    nombre: 'Comunicación',
    descripcion: 'Área de Comunicación',
    horasSemana: 4,
    niveles: {
      INICIAL: [
        { codigo: 'C01', nombre: 'Se comunica oralmente en su lengua materna.' },
        { codigo: 'C02', nombre: 'Lee diversos tipos de textos escritos en su lengua materna.' },
        { codigo: 'C03', nombre: 'Escribe diversos tipos de textos en su lengua materna.' },
      ],
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Se comunica oralmente en su lengua materna.' },
        { codigo: 'C02', nombre: 'Lee diversos tipos de textos escritos en su lengua materna.' },
        { codigo: 'C03', nombre: 'Escribe diversos tipos de textos en su lengua materna.' },
      ],
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Se comunica oralmente en su lengua materna.' },
        { codigo: 'C02', nombre: 'Lee diversos tipos de textos escritos en lengua materna.' },
        { codigo: 'C03', nombre: 'Escribe diversos tipos de textos en lengua materna.' },
      ],
    },
  },
  {
    id: 'cur-cyt',
    codigo: 'CYT-01',
    nombre: 'Ciencia y Tecnología',
    descripcion: 'Área de Ciencia y Tecnología',
    horasSemana: 4,
    niveles: {
      INICIAL: [{ codigo: 'C01', nombre: 'Indaga mediante métodos científicos para construir sus conocimientos.' }],
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Indaga mediante métodos científicos para construir sus conocimientos.' },
        {
          codigo: 'C02',
          nombre:
            'Explica el mundo físico basándose en conocimientos sobre los seres vivos; materia y energía; biodiversidad, Tierra y universo.',
        },
        { codigo: 'C03', nombre: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno.' },
      ],
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Indaga mediante métodos científicos para construir sus conocimientos.' },
        {
          codigo: 'C02',
          nombre:
            'Explica el mundo físico basándose en conocimientos sobre los seres vivos; materia y energía; biodiversidad, Tierra y universo.',
        },
        { codigo: 'C03', nombre: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno.' },
      ],
    },
  },
  {
    id: 'cur-ps',
    codigo: 'PS-01',
    nombre: 'Personal Social',
    descripcion: 'Área de Personal Social',
    horasSemana: 4,
    niveles: {
      INICIAL: [
        { codigo: 'C01', nombre: 'Construye su identidad.' },
        { codigo: 'C02', nombre: 'Convive y participa democráticamente en la búsqueda del bien común.' },
        {
          codigo: 'C03',
          nombre:
            'Construye su identidad como persona humana, amada por Dios, digna, libre y trascendente, comprendiendo la doctrina de su propia religión, abierto al diálogo con las que le son cercanas.',
        },
      ],
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Construye su identidad.' },
        { codigo: 'C02', nombre: 'Convive y participa democráticamente en la búsqueda del bien común.' },
        { codigo: 'C03', nombre: 'Construye interpretaciones históricas.' },
        { codigo: 'C04', nombre: 'Gestiona responsablemente el espacio y el ambiente.' },
        { codigo: 'C05', nombre: 'Gestiona responsablemente los recursos económicos.' },
      ],
    },
  },
  {
    id: 'cur-psic',
    codigo: 'PSI-01',
    nombre: 'Psicomotriz',
    descripcion: 'Área de Psicomotriz',
    horasSemana: 3,
    niveles: {
      INICIAL: [{ codigo: 'C01', nombre: 'Se desenvuelve de manera autónoma a través de su motricidad.' }],
    },
  },
  {
    id: 'cur-arte',
    codigo: 'ART-01',
    nombre: 'Arte y Cultura',
    descripcion: 'Área de Arte y Cultura',
    horasSemana: 3,
    niveles: {
      INICIAL: [{ codigo: 'C01', nombre: 'Crea proyectos desde los lenguajes artísticos.' }],
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Aprecia de manera crítica manifestaciones artístico-culturales.' },
        { codigo: 'C02', nombre: 'Crea proyectos desde los lenguajes artísticos.' },
      ],
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Aprecia de manera crítica manifestaciones artístico-culturales.' },
        { codigo: 'C02', nombre: 'Crea proyectos desde los lenguajes artísticos.' },
      ],
    },
  },
  {
    id: 'cur-ef',
    codigo: 'EF-01',
    nombre: 'Educación Física',
    descripcion: 'Área de Educación Física',
    horasSemana: 3,
    niveles: {
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Se desenvuelve de manera autónoma a través de su motricidad.' },
        { codigo: 'C02', nombre: 'Asume una vida saludable.' },
        { codigo: 'C03', nombre: 'Interactúa a través de sus habilidades sociomotrices.' },
      ],
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Se desenvuelve de manera autónoma a través de su motricidad.' },
        { codigo: 'C02', nombre: 'Asume una vida saludable.' },
        { codigo: 'C03', nombre: 'Interactúa a través de sus habilidades sociomotrices.' },
      ],
    },
  },
  {
    id: 'cur-ing',
    codigo: 'ING-01',
    nombre: 'Inglés',
    descripcion: 'Área de Inglés',
    horasSemana: 3,
    niveles: {
      PRIMARIA: [
        { codigo: 'C01', nombre: 'Se comunica oralmente en inglés como lengua extranjera.' },
        { codigo: 'C02', nombre: 'Lee diversos tipos de textos en inglés como lengua extranjera.' },
        { codigo: 'C03', nombre: 'Escribe diversos tipos de textos en inglés como lengua extranjera.' },
      ],
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Se comunica oralmente en inglés como lengua extranjera.' },
        { codigo: 'C02', nombre: 'Lee diversos tipos de textos en inglés como lengua extranjera.' },
        { codigo: 'C03', nombre: 'Escribe diversos tipos de textos en inglés como lengua extranjera.' },
      ],
    },
  },
  {
    id: 'cur-er',
    codigo: 'ER-01',
    nombre: 'Educación Religiosa',
    descripcion: 'Área de Educación Religiosa',
    horasSemana: 2,
    niveles: {
      PRIMARIA: [
        {
          codigo: 'C01',
          nombre:
            'Construye su identidad como persona humana, amada por Dios, digna, libre y trascendente, comprendiendo la doctrina de su propia religión, abierto al diálogo con las que le son cercanas.',
        },
        {
          codigo: 'C02',
          nombre:
            'Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida en coherencia con su creencia religiosa.',
        },
      ],
      SECUNDARIA: [
        {
          codigo: 'C01',
          nombre:
            'Construye su identidad como persona humana, amada por Dios, digna, libre y trascendente, comprendiendo la doctrina de su propia religión, abierto al diálogo con las que le son cercanas.',
        },
        {
          codigo: 'C02',
          nombre:
            'Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida en coherencia con su creencia religiosa.',
        },
      ],
    },
  },
  {
    id: 'cur-ccss',
    codigo: 'CCSS-01',
    nombre: 'Ciencias Sociales',
    descripcion: 'Área de Ciencias Sociales',
    horasSemana: 4,
    niveles: {
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Construye interpretaciones históricas.' },
        { codigo: 'C02', nombre: 'Gestiona responsablemente el espacio y el ambiente.' },
        { codigo: 'C03', nombre: 'Gestiona responsablemente los recursos económicos.' },
      ],
    },
  },
  {
    id: 'cur-dpcc',
    codigo: 'DPCC-01',
    nombre: 'Desarrollo Personal, Ciudadanía y Cívica',
    descripcion: 'Área de Desarrollo Personal, Ciudadanía y Cívica',
    horasSemana: 4,
    niveles: {
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Construye su identidad.' },
        { codigo: 'C02', nombre: 'Convive y participa democráticamente en la búsqueda del bien común.' },
      ],
    },
  },
  {
    id: 'cur-ept',
    codigo: 'EPT-01',
    nombre: 'Educación para el Trabajo',
    descripcion: 'Área de Educación para el Trabajo',
    horasSemana: 3,
    niveles: {
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Gestiona proyectos de emprendimiento económico o social.' },
      ],
    },
  },
  {
    id: 'cur-tut',
    codigo: 'TUT-01',
    nombre: 'Tutoría',
    descripcion: 'Tutoría y Orientación Educativa (TOE)',
    horasSemana: 1,
    niveles: {
      SECUNDARIA: [
        { codigo: 'C01', nombre: 'Gestiona su aprendizaje de manera autónoma.' },
      ],
    },
  },
]

/**
 * Niveles donde se dicta un área según su código.
 * El código del curso puede incluir un sufijo (ej: MAT-02) y aún así
 * hereda los niveles del área MAT (MAT-01), comparando por prefijo.
 * Si no se encuentra ningún área, se devuelven los tres niveles
 * (curso libre / no catalogado).
 */
export function obtenerNivelesDeArea(codigoCurso: string): NivelCurricular[] {
  const area = _buscarArea(codigoCurso)
  if (!area) return ['INICIAL', 'PRIMARIA', 'SECUNDARIA']
  return Object.keys(area.niveles) as NivelCurricular[]
}

/**
 * Competencias referenciales de un área para un nivel.
 * El código del curso puede incluir un sufijo (ej: MAT-02) y aún así
 * hereda las competencias del área MAT (MAT-01), comparando por prefijo.
 */
export function obtenerCompetenciasDeArea(
  codigoCurso: string,
  nivel: NivelCurricular,
): CompetenciaReferencial[] {
  const area = _buscarArea(codigoCurso)
  return area?.niveles[nivel] ?? []
}

function _buscarArea(codigoCurso: string): AreaCneb | undefined {
  const codigo = codigoCurso.trim().toUpperCase()
  const prefijo = codigo.split('-')[0]
  return AREAS_CNEB.find(
    (a) => a.codigo.toUpperCase() === codigo || a.codigo.toUpperCase().startsWith(`${prefijo}-`),
  )
}

/** Grados sugeridos por nivel, en el orden del CNEB. */
export const GRADOS_POR_NIVEL: Record<NivelCurricular, { id: string; codigo: string; nombre: string; orden: number }[]> =
  {
    INICIAL: [
      { id: 'grad-ini3', codigo: 'INI-3', nombre: 'Inicial 3 años', orden: 1 },
      { id: 'grad-ini4', codigo: 'INI-4', nombre: 'Inicial 4 años', orden: 2 },
      { id: 'grad-ini5', codigo: 'INI-5', nombre: 'Inicial 5 años', orden: 3 },
    ],
    PRIMARIA: [
      { id: 'grad-1-prim', codigo: '1PRI', nombre: '1º Primaria', orden: 1 },
      { id: 'grad-2-prim', codigo: '2PRI', nombre: '2º Primaria', orden: 2 },
      { id: 'grad-3-prim', codigo: '3PRI', nombre: '3º Primaria', orden: 3 },
      { id: 'grad-4-prim', codigo: '4PRI', nombre: '4º Primaria', orden: 4 },
      { id: 'grad-5-prim', codigo: '5PRI', nombre: '5º Primaria', orden: 5 },
      { id: 'grad-6-prim', codigo: '6PRI', nombre: '6º Primaria', orden: 6 },
    ],
    SECUNDARIA: [
      { id: 'grad-1-sec', codigo: '1SEC', nombre: '1º Secundaria', orden: 1 },
      { id: 'grad-2-sec', codigo: '2SEC', nombre: '2º Secundaria', orden: 2 },
      { id: 'grad-3-sec', codigo: '3SEC', nombre: '3º Secundaria', orden: 3 },
      { id: 'grad-4-sec', codigo: '4SEC', nombre: '4º Secundaria', orden: 4 },
      { id: 'grad-5-sec', codigo: '5SEC', nombre: '5º Secundaria', orden: 5 },
    ],
  }