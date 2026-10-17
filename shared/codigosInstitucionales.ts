/**
 * Códigos institucionales (contrato compartido frontend/API).
 *
 * Formato: [LETRA][AÑO 2D][CORRELATIVO 6D] — p. ej. D26000001, E26000001.
 * El código es único, permanente (distingue a la persona en toda su historia en
 * la institución) y nunca se reutiliza, ni siquiera con personas eliminadas o
 * retiradas. Es independiente del DNI y del id interno.
 */

export const CODIGOS_INSTITUCIONALES_LETRAS = {
  E: 'Estudiante',
  P: 'Profesor',
  D: 'Director',
  S: 'Secretaría',
  A: 'Personal',
} as const

export type CodigoInstitucionalLetra = keyof typeof CODIGOS_INSTITUCIONALES_LETRAS

/** Letra del código institucional según el id de rol (plantillas iniciales). */
export function letraCodigoInstitucionalPorRol(rolId: string): CodigoInstitucionalLetra | null {
  switch (rolId) {
    case 'director':
      return 'D'
    case 'profesor':
      return 'P'
    case 'secretaria':
      return 'S'
    case 'personal':
      return 'A'
    default:
      return null
  }
}

/** Dígitos del correlativo (fija la longitud total del código). */
export const CORRELATIVO_CODIGO_INSTITUCIONAL_DIGITOS = 6