import { Request, Response, NextFunction } from 'express'
import { loginSchema } from './auth.schema'
import * as authService from './auth.service'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = loginSchema.parse(req.body)
    const result = await authService.login(dto)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const usuario = await authService.me(req.user!.userId)
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}
