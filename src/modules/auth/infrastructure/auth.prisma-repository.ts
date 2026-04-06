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
      select: { id: true, nombre: true, email: true, rol: true, clienteId: true, activo: true },
    })
  }
}
