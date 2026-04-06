import { z } from 'zod'

export const updateEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'ENTREGADO', 'INCIDENCIA']),
})

export const updateDetalleSchema = z.object({
  receptorNombre: z.string().optional(),
  horaLlegada: z.string().optional(),
  horaSalida: z.string().optional(),
  temperatura: z.string().optional(),
  observaciones: z.string().optional(),
})

export type UpdateEstadoGuiaDto = z.infer<typeof updateEstadoSchema>
export type UpdateDetalleGuiaDto = z.infer<typeof updateDetalleSchema>
