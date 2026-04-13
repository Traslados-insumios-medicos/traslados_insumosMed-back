import { Request, Response, NextFunction } from 'express'
import { createClienteSchema, updateClienteSchema } from './clientes.schema'
import * as svc from './clientes.service'
import { emitRefresh } from '../../websocket'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20)
    const tipo = req.query.tipo as 'PRINCIPAL' | 'SECUNDARIO' | undefined
    res.json(await svc.getAll(page, limit, tipo))
  } catch (e) { next(e) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getById(req.params.id as string)) } catch (e) { next(e) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createClienteSchema.parse(req.body)
    const result = await svc.create(dto)
    emitRefresh('clientes', req.headers['x-socket-id'] as string | undefined)
    res.status(201).json(result)
  } catch (e) { next(e) }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateClienteSchema.parse(req.body)
    const result = await svc.update(req.params.id as string, dto)
    emitRefresh('clientes', req.headers['x-socket-id'] as string | undefined)
    res.json(result)
  } catch (e) { next(e) }
}

export const toggleActivo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.toggleActivo(req.params.id as string)
    emitRefresh('clientes', req.headers['x-socket-id'] as string | undefined)
    res.json(result)
  } catch (e) { next(e) }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.remove(req.params.id as string)
    emitRefresh('clientes', req.headers['x-socket-id'] as string | undefined)
    res.status(204).send()
  } catch (e) { next(e) }
}
