import { prisma } from '../../config/prisma'
import { ensureRutaSeguimientoLogsTable, deleteRutasInTransaction } from '../../db/rutaHardDelete'
import { UpdateUsuarioDto } from './usuarios.schema'
import { Prisma, Rol } from '@prisma/client'
import { AppError } from '../../utils/app-error'

const SELECT = {
  id: true, nombre: true, email: true, cedula: true,
  rol: true, activo: true, clienteId: true,
}

export const getAll = async (rol?: Rol, page = 1, limit = 10, activo?: boolean) => {
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
  const newActivo = !u.activo
  const result = await prisma.usuario.update({
    where: { id },
    data: { activo: newActivo },
    select: { id: true, nombre: true, activo: true },
  })
  
  // Si se desactivó, emitir evento WebSocket para desconectar al usuario
  if (!newActivo) {
    console.log(`🔴 Usuario ${u.nombre} (${id}) desactivado - emitiendo evento WebSocket`)
    const { emitAccountDeactivated } = await import('../../websocket')
    emitAccountDeactivated(id)
  }
  
  return result
}

export const remove = async (id: string) => {
  const u = await prisma.usuario.findUnique({ where: { id } })
  if (!u) throw new AppError(404, 'Usuario no encontrado')
  if (u.rol !== Rol.CHOFER) throw new AppError(400, 'Solo se pueden eliminar choferes')

  await ensureRutaSeguimientoLogsTable()
  await prisma.$transaction(async (tx) => {
    const rutas = await tx.ruta.findMany({ where: { choferId: id }, select: { id: true } })
    const rutaIds = rutas.map((r) => r.id)
    await deleteRutasInTransaction(tx, rutaIds)
    await tx.usuario.delete({ where: { id } })
  })
}
