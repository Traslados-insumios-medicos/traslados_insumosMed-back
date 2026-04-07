import { Prisma, TipoCliente } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/app-error'
import { CreateClienteDto, UpdateClienteDto } from './clientes.schema'

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

  return prisma.cliente.create({ data: dto as Prisma.ClienteCreateInput, include: clienteInclude })
}

export const update = (id: string, dto: UpdateClienteDto) =>
  prisma.cliente.update({ where: { id }, data: dto as Prisma.ClienteUpdateInput, include: clienteInclude })

export const toggleActivo = async (id: string) => {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
  return prisma.cliente.update({ where: { id }, data: { activo: !cliente.activo }, include: clienteInclude })
}
