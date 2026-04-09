import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'

let seguimientoLogsTableEnsured = false

/** La tabla de logs se crea en caliente; debe existir antes de DELETE en rutas o el servidor responde 500. */
export async function ensureRutaSeguimientoLogsTable(): Promise<void> {
  if (seguimientoLogsTableEnsured) return
  /* Sentencias separadas: algunos pools de Postgres fallan con múltiples statements en un solo round-trip. */
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ruta_seguimiento_logs (
      id TEXT PRIMARY KEY,
      ruta_id TEXT NOT NULL,
      chofer_id TEXT NOT NULL,
      seguimiento_chofer TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_ruta_seguimiento_logs_ruta_id_created_at
      ON ruta_seguimiento_logs (ruta_id, created_at DESC)
  `)
  seguimientoLogsTableEnsured = true
}

/**
 * Borrado ordenado: evita errores de FK (p. ej. Guia → Stop) que Postgres no siempre resuelve al hacer DELETE solo en Ruta.
 */
export async function deleteRutasInTransaction(
  tx: Prisma.TransactionClient,
  rutaIds: string[],
): Promise<void> {
  if (rutaIds.length === 0) return
  await tx.guiaEntrega.deleteMany({ where: { rutaId: { in: rutaIds } } })
  await tx.stop.deleteMany({ where: { rutaId: { in: rutaIds } } })
  await tx.foto.deleteMany({ where: { rutaId: { in: rutaIds } } })
  await tx.$executeRaw`DELETE FROM ruta_seguimiento_logs WHERE ruta_id IN (${Prisma.join(rutaIds)})`
  await tx.ruta.deleteMany({ where: { id: { in: rutaIds } } })
}
