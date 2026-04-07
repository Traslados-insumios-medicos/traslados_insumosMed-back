import { Request, Response, NextFunction } from 'express'
import { createRutaSchema, updateEstadoSchema, assignChoferSchema } from './rutas.schema'
import * as svc from './rutas.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20)

    let choferId = req.query.choferId as string | undefined
    const fecha = req.query.fecha as string | undefined
    const estado = req.query.estado as string | undefined

    // CHOFER role can only see their own routes
    if (req.user?.rol === 'CHOFER') {
      choferId = req.user.userId
    }

    res.json(await svc.getAll({ choferId, fecha, estado, page, limit }))
  } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ruta = await svc.getById(req.params.id as string)
    // CHOFER can only see their own routes
    if (req.user?.rol === 'CHOFER' && ruta.choferId !== req.user.userId) {
      res.status(403).json({ message: 'No tiene permisos para ver esta ruta' })
      return
    }
    res.json(ruta)
  } catch (e) { next(e) }
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
    res.json(await svc.updateEstado(req.params.id as string, dto))
  } catch (e) { next(e) }
}

export const assignChofer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { choferId } = assignChoferSchema.parse(req.body)
    res.json(await svc.assignChofer(req.params.id as string, choferId))
  } catch (e) { next(e) }
}
