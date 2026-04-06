import { Request, Response, NextFunction } from 'express'
import { createNovedadSchema, createSeguimientoSchema } from './novedades.schema'
import * as svc from './novedades.service'

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getAll()) } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id)) } catch (e) { next(e) }
}

export const getByGuia = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getByGuia(req.params.guiaId)) } catch (e) { next(e) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createNovedadSchema.parse(req.body)
    res.status(201).json(await svc.create(dto))
  } catch (e) { next(e) }
}

export const addSeguimiento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createSeguimientoSchema.parse(req.body)
    res.status(201).json(await svc.addSeguimiento(req.params.id, dto))
  } catch (e) { next(e) }
}
