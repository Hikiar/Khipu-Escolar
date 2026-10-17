export type NivelCurricular = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA'

export const NIVELES: NivelCurricular[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA']

export const NIVEL_LABELS: Record<NivelCurricular, string> = {
  INICIAL: 'Inicial',
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
}

/**
 * Niveles donde se dicta un curso según su código.
 * Espejo ligero de server/db/cneb.ts (solo las excepciones): las áreas que
 * aplican a todos los niveles no necesitan aparecer.
 */
const NIVELES_POR_PREFIJO: Record<string, NivelCurricular[]> = {
  PS: ['INICIAL', 'PRIMARIA'],
  PSI: ['INICIAL'],
  EF: ['PRIMARIA', 'SECUNDARIA'],
  ING: ['PRIMARIA', 'SECUNDARIA'],
  ER: ['PRIMARIA', 'SECUNDARIA'],
  CCSS: ['SECUNDARIA'],
  DPCC: ['SECUNDARIA'],
  EPT: ['SECUNDARIA'],
  TUT: ['SECUNDARIA'],
}

export function nivelesValidosDeCurso(codigo: string): NivelCurricular[] {
  const prefijo = codigo.trim().toUpperCase().split('-')[0]
  return NIVELES_POR_PREFIJO[prefijo] ?? ['INICIAL', 'PRIMARIA', 'SECUNDARIA']
}

export function etiquetaNiveles(niveles: (NivelCurricular | string)[]): string {
  return niveles
    .map((n) => NIVEL_LABELS[n as NivelCurricular] ?? n)
    .filter(Boolean)
    .join(', ')
    || 'Sin nivel'
}