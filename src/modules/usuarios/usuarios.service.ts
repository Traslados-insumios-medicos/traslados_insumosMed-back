import { prisma } from '../../config/prisma'
import { UpdateUsuarioDto } from './usuarios.schema'
import { Prisma, Rol } from '@prisma/client'
import { AppError } from '../../utils/app-error'

const SELECT = {
  id: true, nombre: true, email: true, cedula: true,
  rol: true, activo: true, clienteId: true,
}

export const getAll = async (rol?: Rol, page = 1, limit = 20, activo?: boolean) => {
  const where: Prisma.UsuarioWhereInput = {}
  if (rol) where.rol = rol
  if (activo !== undefined) where.activo = activo
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

export const remove = async (id: string) => {
  const u = await prisma.usuario.findUnique({
    where: { id },
    include: { _count: { select: { rutas: true } } },
  })
  if (!u) throw new AppError(404, 'Usuario no encontrado')
  if (u.rol !== Rol.CHOFER) throw new AppError(400, 'Solo se pueden eliminar choferes')
  if (u._count.rutas > 0) {
    throw new AppError(409, 'No se puede eliminar el chofer porque tiene rutas asignadas')
  }
  await prisma.usuario.delete({ where: { id } })
}
