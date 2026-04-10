import { Request, Response, NextFunction } from 'express'
import { loginSchema, registerSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema'
import { authUseCases } from './infrastructure/auth.container'
import { sendPasswordResetEmail } from '../../services/email.service'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = loginSchema.parse(req.body)
    const result = await authUseCases.login(dto)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = registerSchema.parse(req.body)
    const result = await authUseCases.register(dto)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = changePasswordSchema.parse(req.body)
    const result = await authUseCases.changePassword(req.user!.userId, dto)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = forgotPasswordSchema.parse(req.body)
    const result = await authUseCases.forgotPassword(dto)
    
    // Si hay un usuario, enviar email
    const resetResult = result as { resetToken?: string; usuario?: { email: string; nombre: string } }
    if (resetResult.resetToken && resetResult.usuario) {
      sendPasswordResetEmail({
        to: resetResult.usuario.email,
        nombre: resetResult.usuario.nombre,
        resetToken: resetResult.resetToken,
      }).catch((err) => {
        console.error('Error enviando email de recuperación:', err)
      })
    }
    
    // Siempre devolver el mismo mensaje por seguridad
    res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = resetPasswordSchema.parse(req.body)
    const result = await authUseCases.resetPassword(dto)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const usuario = await authUseCases.me(req.user!.userId)
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}
