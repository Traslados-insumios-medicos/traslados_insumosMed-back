import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/app-error'
import { CreateRutaDto, UpdateEstadoDto } from './rutas.schema'
import { EstadoRuta } from '@prisma/client'

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

  return prisma.$transaction(async (tx) => {
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
}

export const updateEstado = (id: string, dto: UpdateEstadoDto) =>
  prisma.ruta.update({ where: { id }, data: { estado: dto.estado }, include: rutaInclude })

export const assignChofer = async (id: string, choferId: string) => {
  const chofer = await prisma.usuario.findUnique({ where: { id: choferId } })
  if (!chofer) throw new AppError(404, 'Chofer no encontrado')
  return prisma.ruta.update({ where: { id }, data: { choferId }, include: rutaInclude })
}
