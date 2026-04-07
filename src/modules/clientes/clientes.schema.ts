import { z } from 'zod'

export const createClienteSchema = z.object({
  nombre: z.string().min(1),
  ruc: z.string().min(1),
  direccion: z.string().min(1),
  telefonoContacto: z.string().optional(),
  emailContacto: z.string().email().optional(),
  tipo: z.enum(['PRINCIPAL', 'SECUNDARIO']).default('SECUNDARIO'),
  clientePrincipalId: z.string().optional(),
})

export const updateClienteSchema = createClienteSchema.omit({ ruc: true }).partial()

export type CreateClienteDto = z.infer<typeof createClienteSchema>
export type UpdateClienteDto = z.infer<typeof updateClienteSchema>
