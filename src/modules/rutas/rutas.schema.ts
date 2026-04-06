import { z } from 'zod'

const stopInputSchema = z.object({
  orden: z.number().int().positive(),
  direccion: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  clienteId: z.string(),
  notas: z.string().optional(),
  guiaDescripcion: z.string().optional(),
})

export const createRutaSchema = z.object({
  fecha: z.string(),
  choferId: z.string(),
  stops: z.array(stopInputSchema).min(1),
})

export const updateEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']),
})

export const assignChoferSchema = z.object({
  choferId: z.string(),
})

export type CreateRutaDto = z.infer<typeof createRutaSchema>
export type UpdateEstadoDto = z.infer<typeof updateEstadoSchema>
