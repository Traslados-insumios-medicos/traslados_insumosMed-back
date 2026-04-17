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

  async findUserByCelular(celular: string) {
    return prisma.usuario.findUnique({ where: { celular } })
  }

  async findUserById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, cedula: true, email: true, rol: true, clienteId: true, activo: true, mustChangePassword: true, createdAt: true },
    })
  }

  async updateProfile(userId: string, data: { nombre?: string; cedula?: string }) {
    return prisma.usuario.update({
      where: { id: userId },
      data,
      select: { id: true, nombre: true, cedula: true, email: true, rol: true, clienteId: true, activo: true, createdAt: true },
    })
  }

  async createUser(data: {
    nombre: string
    email: string
    password: string
    rol: string
    cedula?: string
    celular?: string
    clienteId?: string
  }) {
    return prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rol: data.rol as any,
        cedula: data.cedula,
        celular: data.celular,
        clienteId: data.clienteId,
        mustChangePassword: true,
      },
      select: { id: true, nombre: true, email: true, rol: true },
    })
  }

  async updateUser(userId: string, data: {
    nombre?: string
    clienteId?: string | null
    password?: string
    activo?: boolean
    mustChangePassword?: boolean
  }) {
    return prisma.usuario.update({
      where: { id: userId },
      data,
      select: { id: true, nombre: true, email: true, rol: true },
    })
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    })
  }

  async findUserByResetToken(token: string) {
    return prisma.usuario.findUnique({
      where: { resetToken: token },
      select: { id: true, nombre: true, email: true, rol: true, resetTokenExpiry: true },
    })
  }

  async setResetToken(userId: string, token: string, expiry: Date) {
    await prisma.usuario.update({
      where: { id: userId },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })
  }

  async clearResetToken(userId: string) {
    await prisma.usuario.update({
      where: { id: userId },
      data: { resetToken: null, resetTokenExpiry: null },
    })
  }

  async updateActiveSessionToken(userId: string, sessionToken: string) {
    await prisma.usuario.update({
      where: { id: userId },
      data: { activeSessionToken: sessionToken },
    })
  }

  async validateSessionToken(userId: string, sessionToken: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { activeSessionToken: true },
    })
    return usuario?.activeSessionToken === sessionToken
  }
}
