import { prisma } from '../../config/prisma'
import { UpdateUsuarioDto } from './usuarios.schema'
import { Rol } from '@prisma/client'

const SELECT = {
  id: true, nombre: true, email: true, cedula: true,
  rol: true, activo: true, clienteId: true,
}

export const getAll = async (rol?: Rol, page = 1, limit = 20) => {
  const where = rol ? { rol } : undefined
  const skip = (page - 1) * limit

  const [data, total] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      select: SELECT,
      orderBy: { nombre: 'asc' },
      skip,
      take: limit,
    }),
    prisma.usuario.count({ where }),
  ])

  return { data, total, page, limit }
}

export const getById = (id: string) =>
  prisma.usuario.findUniqueOrThrow({ where: { id }, select: SELECT })

export const update = (id: string, dto: UpdateUsuarioDto) =>
  prisma.usuario.update({ where: { id }, data: dto, select: SELECT })

export const toggleActivo = async (id: string) => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { id } })
  return prisma.usuario.update({
    where: { id },
    data: { activo: !u.activo },
    select: { id: true, nombre: true, activo: true },
  })
}
