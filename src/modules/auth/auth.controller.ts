import { Request, Response, NextFunction } from 'express'
import { loginSchema, registerSchema, changePasswordSchema } from './auth.schema'
import { authUseCases } from './infrastructure/auth.container'

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

export async function generateTempPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const result = await authUseCases.generateTempPassword(userId as string)
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
