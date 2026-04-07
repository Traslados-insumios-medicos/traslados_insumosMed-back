/**
 * INFRASTRUCTURE LAYER — Adapter: Prisma Repository
 * Implementa IAuthRepository usando Prisma (adaptador de base de datos).
 */
import { prisma } from '../../../config/prisma'
import { IAuthRepository } from '../domain/auth.port'

export class AuthPrismaRepository implements IAuthRepository {
  async findUserByEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } })
  }

  async findUserById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, rol: true, clienteId: true, activo: true, mustChangePassword: true },
    })
  }

  async createUser(data: {
    nombre: string
    email: string
    password: string
    rol: string
    cedula?: string
    clienteId?: string
  }) {
    return prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rol: data.rol as any,
        cedula: data.cedula,
        clienteId: data.clienteId,
        mustChangePassword: true,
      },
      select: { id: true, nombre: true, email: true, rol: true },
    })
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    })
  }
}
