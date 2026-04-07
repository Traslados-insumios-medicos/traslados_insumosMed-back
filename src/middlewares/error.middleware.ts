import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/app-error'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const issues = err.issues ?? (err as any).errors ?? []
    res.status(400).json({
      message: 'Datos inválidos',
      errors: issues.map((e: any) => ({ field: Array.isArray(e.path) ? e.path.join('.') : '', message: e.message })),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message })
    return
  }

  if (err instanceof Error) {
    console.error(err.message)
    res.status(500).json({ message: 'Error interno del servidor' })
    return
  }

  res.status(500).json({ message: 'Error interno del servidor' })
}
