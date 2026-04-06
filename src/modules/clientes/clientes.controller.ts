import { Request, Response, NextFunction } from 'express'
import { createClienteSchema, updateClienteSchema } from './clientes.schema'
import * as svc from './clientes.service'

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getAll()) } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id)) } catch (e) { next(e) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createClienteSchema.parse(req.body)
    res.status(201).json(await svc.create(dto))
  } catch (e) { next(e) }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateClienteSchema.parse(req.body)
    res.json(await svc.update(req.params.id, dto))
  } catch (e) { next(e) }
}

export const toggleActivo = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.toggleActivo(req.params.id)) } catch (e) { next(e) }
}
