import { Request, Response, NextFunction } from 'express'
import { createUsuarioSchema, updateUsuarioSchema } from './usuarios.schema'
import * as svc from './usuarios.service'
import { Rol } from '@prisma/client'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rol = req.query.rol as Rol | undefined
    res.json(await svc.getAll(rol))
  } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id)) } catch (e) { next(e) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createUsuarioSchema.parse(req.body)
    res.status(201).json(await svc.create(dto))
  } catch (e) { next(e) }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateUsuarioSchema.parse(req.body)
    res.json(await svc.update(req.params.id, dto))
  } catch (e) { next(e) }
}

export const toggleActivo = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.toggleActivo(req.params.id)) } catch (e) { next(e) }
}
