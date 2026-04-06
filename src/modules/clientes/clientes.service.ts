import { prisma } from '../../config/prisma'
import { CreateClienteDto, UpdateClienteDto } from './clientes.schema'

export const getAll = () =>
  prisma.cliente.findMany({ orderBy: { nombre: 'asc' } })

export const getById = (id: string) =>
  prisma.cliente.findUniqueOrThrow({ where: { id } })

export const create = (dto: CreateClienteDto) =>
  prisma.cliente.create({ data: dto })

export const update = (id: string, dto: UpdateClienteDto) =>
  prisma.cliente.update({ where: { id }, data: dto })

export const toggleActivo = async (id: string) => {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
  return prisma.cliente.update({ where: { id }, data: { activo: !cliente.activo } })
}
