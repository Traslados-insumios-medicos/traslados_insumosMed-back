import { z } from 'zod'

export const createUsuarioSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  cedula: z.string().optional(),
  rol: z.enum(['ADMIN', 'CHOFER', 'CLIENTE']),
  clienteId: z.string().optional(),
})

export const updateUsuarioSchema = createUsuarioSchema.omit({ password: true }).partial()

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>
