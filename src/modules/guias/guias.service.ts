import { prisma } from '../../config/prisma'
import { UpdateEstadoGuiaDto, UpdateDetalleGuiaDto } from './guias.schema'

const guiaInclude = {
  cliente: { select: { id: true, nombre: true } },
  stop: true,
  fotos: true,
  novedades: { include: { seguimientos: true } },
}

export const getById = (id: string) =>
  prisma.guiaEntrega.findUniqueOrThrow({ where: { id }, include: guiaInclude })

export const getByCliente = (clienteId: string) =>
  prisma.guiaEntrega.findMany({
    where: { clienteId },
    include: guiaInclude,
    orderBy: { createdAt: 'desc' },
  })

export const updateEstado = (id: string, dto: UpdateEstadoGuiaDto) =>
  prisma.guiaEntrega.update({ where: { id }, data: { estado: dto.estado } })

export const updateDetalle = (id: string, dto: UpdateDetalleGuiaDto) =>
  prisma.guiaEntrega.update({ where: { id }, data: dto })
