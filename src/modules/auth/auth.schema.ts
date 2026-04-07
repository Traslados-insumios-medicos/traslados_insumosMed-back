import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.enum(['ADMIN', 'CHOFER', 'CLIENTE']),
  cedula: z.string().optional(),
  clienteId: z.string().optional(),
})

export const changePasswordSchema = z.object({
  passwordActual: z.string().min(6),
  passwordNueva: z.string().min(6),
  confirmacion: z.string().min(6),
}).refine((d) => d.passwordNueva === d.confirmacion, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmacion'],
})

export type LoginDto = z.infer<typeof loginSchema>
export type RegisterDto = z.infer<typeof registerSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>
