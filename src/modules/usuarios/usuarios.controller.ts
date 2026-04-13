import { Request, Response, NextFunction } from 'express'
import { registerSchema } from '../auth/auth.schema'
import { updateUsuarioSchema } from './usuarios.schema'
import * as svc from './usuarios.service'
import { authUseCases } from '../auth/infrastructure/auth.container'
import { Rol } from '@prisma/client'
import { emitRefresh } from '../../websocket'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rol = req.query.rol as Rol | undefined
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20)
    let activo: boolean | undefined
    if (req.query.activo === 'true') activo = true
    else if (req.query.activo === 'false') activo = false
    res.json(await svc.getAll(rol, page, limit, activo))
  } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id as string)) } catch (e) { next(e) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = registerSchema.parse(req.body)
    const result = await authUseCases.register(dto)
    emitRefresh('usuarios')
    res.status(201).json(result)
  } catch (e) { next(e) }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateUsuarioSchema.parse(req.body)
    const result = await svc.update(req.params.id as string, dto)
    emitRefresh('usuarios')
    res.json(result)
  } catch (e) { next(e) }
}

export const toggleActivo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.toggleActivo(req.params.id as string)
    emitRefresh('usuarios')
    res.json(result)
  } catch (e) { next(e) }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.remove(req.params.id as string)
    emitRefresh('usuarios')
    res.status(204).send()
  } catch (e) { next(e) }
}
