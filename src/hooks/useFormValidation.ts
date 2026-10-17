import { useForm, type UseFormProps, type UseFormReturn, type FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z, type ZodSchema } from "zod"

/**
 * Hook personalizado que combina react-hook-form con zod
 * Uso:
 * const form = useFormValidation({ schema: alumnoSchema, defaultValues: {} })
 */
export function useFormValidation<T extends FieldValues>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, "resolver">
): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema) as any,
    mode: "onBlur",
    reValidateMode: "onChange",
    ...options,
  })
}

/**
 * Helper para crear esquemas comunes
 */
export const commonSchemas = {
  // DNI peruano (8 dígitos)
  dni: z.string().length(8, "El DNI debe tener 8 dígitos").regex(/^\d+$/, "Solo números"),

  // Email
  email: z.string().email("Email inválido").optional().or(z.literal("")),

  // Teléfono peruano
  phone: z.string().regex(/^9\d{8}$/, "Teléfono inválido (9 dígitos iniciando con 9)").optional().or(z.literal("")),

  // Nombre (solo letras, espacios, acentos)
  name: z.string().min(2, "Mínimo 2 caracteres").max(100).regex(/^[\p{L}\s'-]+$/u, "Solo letras, espacios, guiones y apóstrofes"),

  // Código alfanumérico
  code: z.string().min(1).max(20).regex(/^[A-Z0-9-]+$/i, "Solo letras, números y guiones"),

  // Número positivo
  positiveNumber: z.coerce.number().int().positive("Debe ser un número positivo"),

  // Número entero no negativo
  nonNegativeNumber: z.coerce.number().int().min(0, "No puede ser negativo"),

  // Texto requerido
  requiredString: z.string().min(1, "Campo requerido"),

  // Texto opcional
  optionalString: z.string().optional(),
}

/**
 * Composición de esquemas para formularios comunes
 */
export const formSchemas = {
  alumno: z.object({
    dni: commonSchemas.dni,
    nombres: commonSchemas.name,
    apellidos: commonSchemas.name,
    correo: commonSchemas.email,
    telefono: commonSchemas.phone,
  }),

  docente: z.object({
    dni: commonSchemas.dni,
    nombres: commonSchemas.name,
    apellidos: commonSchemas.name,
    correo: commonSchemas.email,
    telefono: commonSchemas.phone,
    especialidad: commonSchemas.optionalString,
    fechaIngreso: z.string().min(1, "Fecha requerida"),
    niveles: z.array(z.enum(["INICIAL", "PRIMARIA", "SECUNDARIA"])).min(1, "Seleccione al menos un nivel"),
  }),

  curso: z.object({
    codigo: commonSchemas.code,
    nombre: commonSchemas.name,
    descripcion: commonSchemas.optionalString,
    horasSemanales: commonSchemas.positiveNumber.optional(),
    orden: commonSchemas.nonNegativeNumber.optional(),
  }),

  grado: z.object({
    codigo: commonSchemas.code,
    nombre: commonSchemas.name,
    nivel: z.enum(["INICIAL", "PRIMARIA", "SECUNDARIA"]),
    orden: commonSchemas.nonNegativeNumber.optional(),
  }),

  seccion: z.object({
    gradoId: z.string().min(1, "Grado requerido"),
    nombre: commonSchemas.requiredString,
    turno: z.enum(["MAÑANA", "TARDE", "NOCHE"]).optional(),
  }),

  clase: z.object({
    periodoId: z.string().min(1, "Periodo requerido"),
    gradoId: z.string().min(1, "Grado requerido"),
    seccionId: z.string().min(1, "Sección requerida"),
    tutorDocenteId: z.string().optional(),
    vacantes: commonSchemas.positiveNumber.default(30),
    estado: z.enum(["ACTIVO", "CERRADA"]).default("ACTIVO"),
  }),

  usuario: z.object({
    personaId: z.string().min(1, "Persona requerida"),
    username: commonSchemas.dni,
    rolIds: z.array(z.string()).min(1, "Al menos un rol"),
    password: z.string().min(8, "Mínimo 8 caracteres").optional(),
  }),

  modeloEvaluacion: z.object({
    codigo: commonSchemas.code,
    nombre: commonSchemas.name,
    descripcion: commonSchemas.optionalString,
  }),

  configuracionEvaluacion: z.object({
    cursoId: z.string().min(1, "Curso requerido"),
    gradoId: z.string().min(1, "Grado requerido"),
    modeloEvaluacionId: z.string().min(1, "Modelo requerido"),
  }),
}

/**
 * Tipo helper para inferir el tipo del schema
 */
export type InferSchema<T extends z.ZodSchema> = z.infer<T>