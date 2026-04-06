import { Request, Response, NextFunction } from 'express'
import { createRutaSchema, updateEstadoSchema, assignChoferSchema } from './rutas.schema'
import * as svc from './rutas.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { choferId, fecha, estado } = req.query as Record<string, string>
    res.json(await svc.getAll({ choferId, fecha, estado: estado as any }))
  } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id)) } catch (e) { next(e) }
}

export const getMisRutas = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getByChofer(req.user!.userId)) } catch (e) { next(e) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createRutaSchema.parse(req.body)
    res.status(201).json(await svc.create(dto))
  } catch (e) { next(e) }
}

export const updateEstado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateEstadoSchema.parse(req.body)
    res.json(await svc.updateEstado(req.params.id, dto))
  } catch (e) { next(e) }
}

export const assignChofer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { choferId } = assignChoferSchema.parse(req.body)
    res.json(await svc.assignChofer(req.params.id, choferId))
  } catch (e) { next(e) }
}
