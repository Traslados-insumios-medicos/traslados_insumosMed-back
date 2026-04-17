import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Este campo es requerido'),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  nombre: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'El nombre solo debe contener letras, tildes y ñ'),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email debe contener @, dominio y extensión válida (ej. usuario@empresa.com)'),
  rol: z.enum(['ADMIN', 'CHOFER', 'CLIENTE']),
  cedula: z.string().regex(/^\d{10}$/, 'La cédula debe tener exactamente 10 dígitos numéricos').optional(),
  celular: z.string().regex(/^\d{10}$/, 'El celular debe tener exactamente 10 dígitos numéricos'),
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

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  passwordNueva: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmacion: z.string().min(6),
}).refine((d) => d.passwordNueva === d.confirmacion, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmacion'],
})

export type LoginDto = z.infer<typeof loginSchema>
export type RegisterDto = z.infer<typeof registerSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
