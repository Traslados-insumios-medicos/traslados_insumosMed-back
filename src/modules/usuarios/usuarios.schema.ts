import { z } from 'zod'

export const createUsuarioSchema = z.object({
  nombre: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'El nombre solo debe contener letras, tildes y ñ'),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email debe contener @, dominio y extensión válida (ej. usuario@empresa.com)'),
  password: z.string().min(6),
  cedula: z.string().regex(/^\d{10}$/, 'La cédula debe tener exactamente 10 dígitos numéricos').optional(),
  rol: z.enum(['ADMIN', 'CHOFER', 'CLIENTE']),
  clienteId: z.string().optional(),
})

export const updateUsuarioSchema = createUsuarioSchema.omit({ password: true }).partial()

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>
