import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Rol } from '@prisma/client'
import { prisma } from '../config/prisma'

export interface JwtPayload {
  userId: string
  rol: Rol
  clienteId?: string
  sessionToken?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    const user = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { activo: true, activeSessionToken: true },
    })
    if (!user) {
      res.status(401).json({ message: 'Usuario no encontrado' })
      return
    }
    if (!user.activo) {
      res.status(403).json({ message: 'Su acceso está inactivo. Contacte al administrador de la empresa.' })
      return
    }
    
    // Sesiones simultáneas permitidas — no validar sessionToken
    
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

export function authorize(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol)) {
      res.status(403).json({ message: 'No tiene permisos para esta acción' })
      return
    }
    next()
  }
}
