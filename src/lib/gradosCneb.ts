import type { NivelCurricular } from './nivelesCurso'

export interface GradoCneB {
  codigo: string
  nombre: string
  orden: number
}

/**
 * Catálogo de grados del CNEB (Perú).
 * Los grados son fijos y definidos por nivel; las secciones son variables
 * (dependen de la cantidad de aulas de cada institución).
 * Espejo ligero de server/db/cneb.ts (GRADOS_POR_NIVEL).
 */
export const GRADOS_CNEB: Record<NivelCurricular, GradoCneB[]> = {
  INICIAL: [
    { codigo: 'INI-3', nombre: '3 años', orden: 1 },
    { codigo: 'INI-4', nombre: '4 años', orden: 2 },
    { codigo: 'INI-5', nombre: '5 años', orden: 3 },
  ],
  PRIMARIA: [
    { codigo: '1PRI', nombre: '1º Primaria', orden: 1 },
    { codigo: '2PRI', nombre: '2º Primaria', orden: 2 },
    { codigo: '3PRI', nombre: '3º Primaria', orden: 3 },
    { codigo: '4PRI', nombre: '4º Primaria', orden: 4 },
    { codigo: '5PRI', nombre: '5º Primaria', orden: 5 },
    { codigo: '6PRI', nombre: '6º Primaria', orden: 6 },
  ],
  SECUNDARIA: [
    { codigo: '1SEC', nombre: '1º Secundaria', orden: 1 },
    { codigo: '2SEC', nombre: '2º Secundaria', orden: 2 },
    { codigo: '3SEC', nombre: '3º Secundaria', orden: 3 },
    { codigo: '4SEC', nombre: '4º Secundaria', orden: 4 },
    { codigo: '5SEC', nombre: '5º Secundaria', orden: 5 },
  ],
}

export function gradosCneBDeNivel(nivel: string): GradoCneB[] {
  return GRADOS_CNEB[nivel as NivelCurricular] ?? []
}