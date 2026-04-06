import { Request, Response, NextFunction } from 'express'
import * as svc from './reportes.service'

export const porCliente = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.reportePorCliente()) } catch (e) { next(e) }
}

export const porChofer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const choferId = req.query.choferId as string | undefined
    res.json(await svc.reportePorChofer(choferId))
  } catch (e) { next(e) }
}

export const porFecha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta, clienteId } = req.query as Record<string, string>
    res.json(await svc.reportePorFecha(desde, hasta, clienteId))
  } catch (e) { next(e) }
}
