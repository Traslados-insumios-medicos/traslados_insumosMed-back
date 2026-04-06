/**
 * INFRASTRUCTURE LAYER — HTTP Adapter (Express Controller)
 * Traduce HTTP → casos de uso → HTTP response.
 */
import { Request, Response, NextFunction } from 'express'
import { loginSchema } from './auth.schema'
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

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const usuario = await authUseCases.me(req.user!.userId)
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}
