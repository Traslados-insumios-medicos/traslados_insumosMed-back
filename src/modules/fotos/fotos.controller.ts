import { Request, Response, NextFunction } from 'express'
import * as svc from './fotos.service'
import { TipoFoto } from '@prisma/client'

export const uploadToGuia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No se recibió ninguna imagen' }); return }
    const foto = await svc.uploadFoto({
      buffer: req.file.buffer,
      tipo: 'GUIA' as TipoFoto,
      guiaId: req.params.guiaId,
    })
    res.status(201).json(foto)
  } catch (e) { next(e) }
}

export const uploadToRuta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No se recibió ninguna imagen' }); return }
    const foto = await svc.uploadFoto({
      buffer: req.file.buffer,
      tipo: 'HOJA_RUTA' as TipoFoto,
      rutaId: req.params.rutaId,
    })
    res.status(201).json(foto)
  } catch (e) { next(e) }
}

export const deleteFoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deleteFoto(req.params.id)
    res.json({ message: 'Foto eliminada' })
  } catch (e) { next(e) }
}

export const getByGuia = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getFotosByGuia(req.params.guiaId)) } catch (e) { next(e) }
}

export const getByRuta = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await svc.getFotosByRuta(req.params.rutaId)) } catch (e) { next(e) }
}
