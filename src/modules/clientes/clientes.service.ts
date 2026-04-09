import { Prisma, TipoCliente } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/app-error'
import { CreateClienteDto, UpdateClienteDto } from './clientes.schema'
import { emitWebhookEventAsync } from '../webhooks/webhooks.service'

const clienteInclude = {
  clientePrincipal: { select: { id: true, nombre: true } },
  clientesSecundarios: { select: { id: true, nombre: true, ruc: true, activo: true } },
} satisfies Prisma.ClienteInclude

export const getAll = async (page = 1, limit = 20, tipo?: TipoCliente) => {
  const skip = (page - 1) * limit
  const where: Prisma.ClienteWhereInput = tipo ? { tipo } : {}
  const [data, total] = await Promise.all([
    prisma.cliente.findMany({ where, include: clienteInclude, orderBy: { nombre: 'asc' }, skip, take: limit }),
    prisma.cliente.count({ where }),
  ])
  return { data, total, page, limit }
}

export const getById = (id: string) =>
  prisma.cliente.findUniqueOrThrow({ where: { id }, include: clienteInclude })

export const create = async (dto: CreateClienteDto) => {
  const existing = await prisma.cliente.findUnique({ where: { ruc: dto.ruc } })
  if (existing) throw new AppError(409, `Ya existe un cliente con el RUC ${dto.ruc}`)

  if (dto.tipo === 'SECUNDARIO' && dto.clientePrincipalId) {
    const principal = await prisma.cliente.findUnique({ where: { id: dto.clientePrincipalId } })
    if (!principal) throw new AppError(404, 'Cliente principal no encontrado')
    if (principal.tipo !== 'PRINCIPAL') throw new AppError(400, 'El cliente referenciado no es PRINCIPAL')
  }

  const created = await prisma.cliente.create({ data: dto as Prisma.ClienteCreateInput, include: clienteInclude })
  emitWebhookEventAsync('cliente.created', {
    id: created.id,
    nombre: created.nombre,
    tipo: created.tipo,
    activo: created.activo,
    clientePrincipalId: created.clientePrincipalId ?? null,
  })
  return created
}

export const update = async (id: string, dto: UpdateClienteDto) => {
  const updated = await prisma.cliente.update({ where: { id }, data: dto as Prisma.ClienteUpdateInput, include: clienteInclude })
  emitWebhookEventAsync('cliente.updated', {
    id: updated.id,
    nombre: updated.nombre,
    tipo: updated.tipo,
    activo: updated.activo,
    clientePrincipalId: updated.clientePrincipalId ?? null,
  })
  return updated
}

export const toggleActivo = async (id: string) => {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
  const updated = await prisma.cliente.update({ where: { id }, data: { activo: !cliente.activo }, include: clienteInclude })
  emitWebhookEventAsync('cliente.activo_toggled', {
    id: updated.id,
    nombre: updated.nombre,
    activo: updated.activo,
  })
  return updated
}

export const remove = async (id: string) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      clientesSecundarios: { select: { id: true } },
      _count: { select: { guias: true, stops: true, usuarios: true } },
    },
  })

  if (!cliente) throw new AppError(404, 'Cliente no encontrado')

  if (cliente.tipo === 'PRINCIPAL' && cliente.clientesSecundarios.length > 0) {
    throw new AppError(409, 'No se puede eliminar un cliente principal que tiene clientes secundarios')
  }

  if (cliente._count.guias > 0 || cliente._count.stops > 0 || cliente._count.usuarios > 0) {
    throw new AppError(409, 'No se puede eliminar el cliente porque tiene registros relacionados')
  }

  await prisma.cliente.delete({ where: { id } })
  emitWebhookEventAsync('cliente.deleted', {
    id: cliente.id,
    nombre: cliente.nombre,
    tipo: cliente.tipo,
  })
}
