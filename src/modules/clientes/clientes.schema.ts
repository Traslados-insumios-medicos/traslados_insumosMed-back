import { z } from 'zod'

export const createClienteSchema = z.object({
  nombre: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'El nombre solo debe contener letras, tildes y ñ'),
  ruc: z.string().regex(/^\d{13}$/, 'El RUC debe tener exactamente 13 dígitos numéricos'),
  direccion: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  telefonoContacto: z.string().regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos'),
  emailContacto: z.string().regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email debe contener @, dominio y extensión válida (ej. usuario@empresa.com)'),
  tipo: z.enum(['PRINCIPAL', 'SECUNDARIO']).default('SECUNDARIO'),
  clientePrincipalId: z.string().optional(),
})

export const updateClienteSchema = createClienteSchema.partial().extend({
  clientePrincipalId: z.union([z.string().min(1), z.null()]).optional(),
})

export type CreateClienteDto = z.infer<typeof createClienteSchema>
export type UpdateClienteDto = z.infer<typeof updateClienteSchema>
