import { Request, Response, NextFunction } from 'express'
import * as svc from './reportes.service'

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.dashboard()) } catch (e) { next(e) }
}

export const porCliente = async (req: Request, res: Response, next: NextFunction) => {
  try { 
    const clienteId = req.query.clienteId as string | undefined
    const desde = req.query.desde as string | undefined
    const hasta = req.query.hasta as string | undefined
    const tipo = req.query.tipo as string | undefined
    const choferId = req.query.choferId as string | undefined
    const ciudad = req.query.ciudad as string | undefined
    res.json(await svc.reportePorCliente({ clienteId, desde, hasta, tipo, choferId, ciudad })) 
  } catch (e) { next(e) }
}

export const porChofer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const choferId = req.query.choferId as string | undefined
    const desde = req.query.desde as string | undefined
    const hasta = req.query.hasta as string | undefined
    res.json(await svc.reportePorChofer({ choferId, desde, hasta }))
  } catch (e) { next(e) }
}

export const porFecha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta, clienteId, choferId, ciudad } = req.query as Record<string, string>
    res.json(await svc.reportePorFecha(desde, hasta, clienteId, choferId, ciudad))
  } catch (e) { next(e) }
}

export const porGuia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta, clienteId, choferId, tipo, ciudad } = req.query as Record<string, string>
    res.json(await svc.reportePorGuia({ desde, hasta, clienteId, choferId, tipo, ciudad }))
  } catch (e) { next(e) }
}
