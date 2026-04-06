import { z } from 'zod'

export const createClienteSchema = z.object({
  nombre: z.string().min(1),
  ruc: z.string().min(1),
  direccion: z.string().min(1),
  telefonoContacto: z.string().optional(),
  emailContacto: z.string().email().optional(),
})

export const updateClienteSchema = createClienteSchema.partial()

export type CreateClienteDto = z.infer<typeof createClienteSchema>
export type UpdateClienteDto = z.infer<typeof updateClienteSchema>
