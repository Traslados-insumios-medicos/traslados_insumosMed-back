import { Request, Response, NextFunction } from 'express'
import { updateEstadoSchema, updateDetalleSchema } from './guias.schema'
import type { VistaMisEnvios } from './guias.service'
import * as svc from './guias.service'

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guia = await svc.getById(req.params.id as string)
    if (req.user?.rol === 'CLIENTE') {
      const cid = req.user.clienteId
      if (!cid) {
        res.status(403).json({ message: 'Sin cliente asociado' })
        return
      }
      const ids = await svc.resolveAlcanceClienteIds(cid)
      if (!ids.includes(guia.clienteId)) {
        res.status(403).json({ message: 'No tiene permisos para ver esta guía' })
        return
      }
    }
    res.json(guia)
  } catch (e) {
    next(e)
  }
}

export const getMisEnvios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clienteId = req.user!.clienteId
    if (!clienteId) {
      res.status(403).json({ message: 'Sin cliente asociado' })
      return
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10) || 20))
    const search = typeof req.query.search === 'string' ? req.query.search : undefined
    const rawVista = typeof req.query.vista === 'string' ? req.query.vista : 'todos'
    const vista: VistaMisEnvios = ['activos', 'historial', 'todos'].includes(rawVista)
      ? (rawVista as VistaMisEnvios)
      : 'todos'

    res.json(
      await svc.getMisEnviosList({
        clienteUsuarioId: clienteId,
        search,
        page,
        limit,
        vista,
      }),
    )
  } catch (e) {
    next(e)
  }
}

export const updateEstado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateEstadoSchema.parse(req.body)
    res.json(await svc.updateEstado(req.params.id as string, dto))
  } catch (e) {
    next(e)
  }
}

export const updateDetalle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateDetalleSchema.parse(req.body)
    res.json(await svc.updateDetalle(req.params.id as string, dto))
  } catch (e) {
    next(e)
  }
}
