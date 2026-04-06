import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma'
import { CreateUsuarioDto, UpdateUsuarioDto } from './usuarios.schema'
import { Rol } from '@prisma/client'

export const getAll = (rol?: Rol) =>
  prisma.usuario.findMany({
    where: rol ? { rol } : undefined,
    select: { id: true, nombre: true, email: true, cedula: true, rol: true, activo: true, clienteId: true },
    orderBy: { nombre: 'asc' },
  })

export const getById = (id: string) =>
  prisma.usuario.findUniqueOrThrow({
    where: { id },
    select: { id: true, nombre: true, email: true, cedula: true, rol: true, activo: true, clienteId: true },
  })

export const create = async (dto: CreateUsuarioDto) => {
  const hashed = await bcrypt.hash(dto.password, 10)
  return prisma.usuario.create({
    data: { ...dto, password: hashed },
    select: { id: true, nombre: true, email: true, cedula: true, rol: true, activo: true, clienteId: true },
  })
}

export const update = (id: string, dto: UpdateUsuarioDto) =>
  prisma.usuario.update({
    where: { id },
    data: dto,
    select: { id: true, nombre: true, email: true, cedula: true, rol: true, activo: true, clienteId: true },
  })

export const toggleActivo = async (id: string) => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { id } })
  return prisma.usuario.update({
    where: { id },
    data: { activo: !u.activo },
    select: { id: true, nombre: true, activo: true },
  })
}
