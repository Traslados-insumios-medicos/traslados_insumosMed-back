import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { LoginDto } from './auth.schema'

export async function login(dto: LoginDto) {
  const usuario = await prisma.usuario.findUnique({ where: { email: dto.email } })
  if (!usuario || !usuario.activo) {
    throw new Error('Credenciales inválidas')
  }

  const valid = await bcrypt.compare(dto.password, usuario.password)
  if (!valid) throw new Error('Credenciales inválidas')

  const payload = {
    userId: usuario.id,
    rol: usuario.rol,
    clienteId: usuario.clienteId ?? undefined,
  }

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as string })

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
    },
  }
}

export async function me(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true, nombre: true, email: true, rol: true, clienteId: true, activo: true },
  })
  if (!usuario) throw new Error('Usuario no encontrado')
  return usuario
}
