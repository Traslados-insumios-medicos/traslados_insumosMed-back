import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/app-error'
import { CreateClienteDto, UpdateClienteDto } from './clientes.schema'

export const getAll = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nombre: 'asc' },
      skip,
      take: limit,
    }),
    prisma.cliente.count(),
  ])
  return { data, total, page, limit }
}

export const getById = (id: string) =>
  prisma.cliente.findUniqueOrThrow({ where: { id } })

export const create = async (dto: CreateClienteDto) => {
  const existing = await prisma.cliente.findUnique({ where: { ruc: dto.ruc } })
  if (existing) throw new AppError(409, `Ya existe un cliente con el RUC ${dto.ruc}`)
  return prisma.cliente.create({ data: dto })
}

export const update = (id: string, dto: UpdateClienteDto) =>
  prisma.cliente.update({ where: { id }, data: dto })

export const toggleActivo = async (id: string) => {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
  return prisma.cliente.update({ where: { id }, data: { activo: !cliente.activo } })
}
