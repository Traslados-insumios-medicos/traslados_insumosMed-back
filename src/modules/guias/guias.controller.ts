import { Request, Response, NextFunction } from 'express'
import { updateEstadoSchema, updateDetalleSchema } from './guias.schema'
import * as svc from './guias.service'

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id as string)) } catch (e) { next(e) }
}

export const getMisEnvios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clienteId = req.user!.clienteId
    if (!clienteId) { res.status(403).json({ message: 'Sin cliente asociado' }); return }
    res.json(await svc.getByCliente(clienteId))
  } catch (e) { next(e) }
}

export const updateEstado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateEstadoSchema.parse(req.body)
    res.json(await svc.updateEstado(req.params.id as string, dto))
  } catch (e) { next(e) }
}

export const updateDetalle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateDetalleSchema.parse(req.body)
    res.json(await svc.updateDetalle(req.params.id as string, dto))
  } catch (e) { next(e) }
}
