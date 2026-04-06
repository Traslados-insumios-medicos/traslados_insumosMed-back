import { z } from 'zod'

export const createNovedadSchema = z.object({
  guiaId: z.string(),
  tipo: z.enum(['DIRECCION_INCORRECTA', 'CLIENTE_AUSENTE', 'MERCADERIA_DANADA', 'OTRO']),
  descripcion: z.string().min(1),
})

export const createSeguimientoSchema = z.object({
  nota: z.string().min(1),
})

export type CreateNovedadDto = z.infer<typeof createNovedadSchema>
export type CreateSeguimientoDto = z.infer<typeof createSeguimientoSchema>
