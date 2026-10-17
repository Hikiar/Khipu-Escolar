import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'
import { leerConfig } from '../config.ts'

/**
 * Cifrado simétrico de contraseñas temporales en reposo (AES-256-GCM).
 * La clave se deriva del secreto de configuración (SHA-256). Formato del payload:
 *   `base64(iv).base64(authTag).base64(ciphertext)`
 */

function derivarClave(): Buffer {
  return createHash('sha256').update(leerConfig().passwordTemporalSecreto).digest()
}

export function cifrarPasswordTemporal(textoPlano: string): string {
  const clave = derivarClave()
  const iv = randomBytes(12)
  const cifrador = createCipheriv('aes-256-gcm', clave, iv)
  const cifrado = Buffer.concat([cifrador.update(textoPlano, 'utf8'), cifrador.final()])
  const tag = cifrador.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), cifrado.toString('base64')].join('.')
}

export function descifrarPasswordTemporal(payload: string): string {
  const [ivB64, tagB64, datosB64] = payload.split('.')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const cifrado = Buffer.from(datosB64, 'base64')
  const descifrador = createDecipheriv('aes-256-gcm', derivarClave(), iv)
  descifrador.setAuthTag(tag)
  return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString('utf8')
}