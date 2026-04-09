import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/app-error'
import { CreateRutaDto, UpdateEstadoDto, UpdateSeguimientoChoferDto } from './rutas.schema'
import { EstadoSeguimientoChofer } from '@prisma/client'
import { getIo } from '../../websocket'
import { emitWebhookEventAsync } from '../webhooks/webhooks.service'

interface SeguimientoRutaLog {
  id: string
  rutaId: string
  choferId: string
  seguimientoChofer: string
  createdAt: Date
}

let trackingTableEnsured = false

async function ensureTrackingTable() {
  if (trackingTableEnsured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ruta_seguimiento_logs (
      id TEXT PRIMARY KEY,
      ruta_id TEXT NOT NULL,
      chofer_id TEXT NOT NULL,
      seguimiento_chofer TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ruta_seguimiento_logs_ruta_id_created_at
      ON ruta_seguimiento_logs (ruta_id, created_at DESC);
  `)
  trackingTableEnsured = true
}

const rutaInclude = {
  chofer: { select: { id: true, nombre: true, cedula: true } },
  stops: {
    orderBy: { orden: 'asc' as const },
    include: {
      cliente: { select: { id: true, nombre: true } },
      guias: {
        include: {
          fotos: true,
          novedades: true,
        },
      },
    },
  },
  guias: true,
  fotos: { where: { tipo: 'HOJA_RUTA' as const } },
}

export interface GetAllFilters {
  choferId?: string
  fecha?: string
  estado?: string
  page?: number
  limit?: number
}

export const getAll = async (filters: GetAllFilters = {}) => {
  const { choferId, fecha, estado, page = 1, limit = 20 } = filters
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (choferId) where.choferId = choferId
  if (fecha) where.fecha = fecha
  if (estado) where.estado = estado

  const [data, total] = await Promise.all([
    prisma.ruta.findMany({
      where,
      include: rutaInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.ruta.count({ where }),
  ])

  return { data, total, page, limit }
}

export const getById = (id: string) =>
  prisma.ruta.findUniqueOrThrow({ where: { id }, include: rutaInclude })

export const create = async (dto: CreateRutaDto) => {
  // Verify chofer exists
  const chofer = await prisma.usuario.findUnique({ where: { id: dto.choferId } })
  if (!chofer) throw new AppError(404, 'Chofer no encontrado')

  const timestamp = String(Date.now()).slice(-6)
  let guiaCounter = 0

  const created = await prisma.$transaction(async (tx) => {
    // Create the ruta
    const ruta = await tx.ruta.create({
      data: {
        fecha: dto.fecha,
        choferId: dto.choferId,
      },
    })

    // Create stops and guias for each stop
    for (const s of dto.stops) {
      const stop = await tx.stop.create({
        data: {
          orden: s.orden,
          direccion: s.direccion,
          lat: s.lat ?? 0,
          lng: s.lng ?? 0,
          notas: s.notas,
          rutaId: ruta.id,
          clienteId: s.clienteId,
        },
      })

      // Resolve guias list: prefer array format, fall back to single guiaDescripcion
      const guiasInput =
        s.guias && s.guias.length > 0
          ? s.guias
          : [{ descripcion: s.guiaDescripcion ?? 'Insumos médicos' }]

      for (const guia of guiasInput) {
        guiaCounter++
        // Format: G-{timestamp_last6digits}-{orden}
        // When multiple guias exist across stops, use a global counter for uniqueness
        const numeroGuia = `G-${timestamp}-${guiaCounter}`
        await tx.guiaEntrega.create({
          data: {
            numeroGuia,
            descripcion: guia.descripcion,
            clienteId: s.clienteId,
            rutaId: ruta.id,
            stopId: stop.id,
          },
        })
      }
    }

    // Return full ruta with includes
    return tx.ruta.findUniqueOrThrow({ where: { id: ruta.id }, include: rutaInclude })
  })
  emitWebhookEventAsync('ruta.created', {
    id: created.id,
    fecha: created.fecha,
    estado: created.estado,
    choferId: created.choferId,
    stops: created.stops.map((s) => ({ id: s.id, orden: s.orden, clienteId: s.clienteId })),
  })
  return created
}

export const updateEstado = async (id: string, dto: UpdateEstadoDto) => {
  const data: Prisma.RutaUpdateInput = { estado: dto.estado }
  if (dto.estado === 'EN_CURSO') {
    data.seguimientoChofer = 'NINGUNO'
  }
  if (dto.estado === 'COMPLETADA' || dto.estado === 'CANCELADA' || dto.estado === 'PENDIENTE') {
    data.seguimientoChofer = 'NINGUNO'
  }
  const updated = await prisma.ruta.update({ where: { id }, data, include: rutaInclude })
  emitWebhookEventAsync('ruta.estado_updated', {
    id: updated.id,
    estado: updated.estado,
    seguimientoChofer: updated.seguimientoChofer,
    choferId: updated.choferId,
  })
  return updated
}

export const updateSeguimientoChofer = async (
  rutaId: string,
  choferUserId: string,
  dto: UpdateSeguimientoChoferDto,
) => {
  const ruta = await prisma.ruta.findUnique({ where: { id: rutaId } })
  if (!ruta) throw new AppError(404, 'Ruta no encontrada')
  if (ruta.choferId !== choferUserId) throw new AppError(403, 'No autorizado')
  if (ruta.estado !== 'EN_CURSO') {
    throw new AppError(400, 'Solo puedes actualizar el seguimiento cuando la ruta está en curso')
  }

  const seguimientoChofer = dto.seguimientoChofer as EstadoSeguimientoChofer
  const updated = await prisma.ruta.update({
    where: { id: rutaId },
    data: { seguimientoChofer },
    include: rutaInclude,
  })

  try {
    getIo().to(`ruta:${rutaId}`).emit('seguimiento_ruta', { rutaId, seguimientoChofer })
  } catch {
    // Ignorar si WS no está listo (tests / arranque)
  }

  await ensureTrackingTable()
  await prisma.$executeRaw`
    INSERT INTO ruta_seguimiento_logs (id, ruta_id, chofer_id, seguimiento_chofer)
    VALUES (${crypto.randomUUID()}, ${rutaId}, ${choferUserId}, ${seguimientoChofer})
  `

  emitWebhookEventAsync('ruta.seguimiento_updated', {
    id: updated.id,
    seguimientoChofer: updated.seguimientoChofer,
    estado: updated.estado,
    choferId: updated.choferId,
  })

  return updated
}

export const getSeguimientoHistory = async (rutaId: string, limit = 100): Promise<SeguimientoRutaLog[]> => {
  await ensureTrackingTable()
  const max = Math.max(1, Math.min(500, limit))
  const rows = await prisma.$queryRaw<{
    id: string
    ruta_id: string
    chofer_id: string
    seguimiento_chofer: string
    created_at: Date
  }[]>`
    SELECT id, ruta_id, chofer_id, seguimiento_chofer, created_at
    FROM ruta_seguimiento_logs
    WHERE ruta_id = ${rutaId}
    ORDER BY created_at DESC
    LIMIT ${max}
  `
  return rows.map((r) => ({
    id: r.id,
    rutaId: r.ruta_id,
    choferId: r.chofer_id,
    seguimientoChofer: r.seguimiento_chofer,
    createdAt: r.created_at,
  }))
}

export const assignChofer = async (id: string, choferId: string) => {
  const chofer = await prisma.usuario.findUnique({ where: { id: choferId } })
  if (!chofer) throw new AppError(404, 'Chofer no encontrado')
  const updated = await prisma.ruta.update({ where: { id }, data: { choferId }, include: rutaInclude })
  emitWebhookEventAsync('ruta.chofer_assigned', {
    id: updated.id,
    choferId: updated.choferId,
    estado: updated.estado,
  })
  return updated
}
