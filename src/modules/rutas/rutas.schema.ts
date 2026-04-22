import { z } from 'zod'

const guiaInputSchema = z.object({
  descripcion: z.string().min(1),
  numeroGuia: z.string().max(50).optional(),
})

const stopInputSchema = z.object({
  orden: z.number().int().positive(),
  direccion: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  clienteId: z.string().min(1),
  notas: z.string().optional(),
  // Support both formats: array of guias (design spec) or single guiaDescripcion (legacy)
  guias: z.array(guiaInputSchema).optional(),
  guiaDescripcion: z.string().optional(),
})

export const createRutaSchema = z.object({
  nombre: z.string().max(60).optional(),
  fecha: z.string().min(1),
  choferId: z.string().min(1),
  stops: z.array(stopInputSchema).min(1),
})

export const updateEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']),
})

export const assignChoferSchema = z.object({
  choferId: z.string().min(1),
})

export const updateSeguimientoChoferSchema = z.object({
  seguimientoChofer: z.enum(['EN_CAMINO', 'CERCA_DESTINO']),
})

export type CreateRutaDto = z.infer<typeof createRutaSchema>
export type UpdateEstadoDto = z.infer<typeof updateEstadoSchema>
export type UpdateSeguimientoChoferDto = z.infer<typeof updateSeguimientoChoferSchema>
