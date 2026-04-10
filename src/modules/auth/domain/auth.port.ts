/**
 * DOMAIN LAYER — Ports (interfaces)
 * Define los contratos que la capa de aplicación necesita.
 * Los adaptadores (infrastructure) implementan estos puertos.
 */
import { AuthResult } from './auth.entity'

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<{
    id: string
    nombre: string
    email: string
    password: string
    rol: string
    clienteId: string | null
    activo: boolean
    mustChangePassword: boolean
  } | null>

  findUserById(id: string): Promise<{
    id: string
    nombre: string
    email: string
    rol: string
    clienteId: string | null
    activo: boolean
    mustChangePassword: boolean
  } | null>

  findUserByResetToken(token: string): Promise<{
    id: string
    nombre: string
    email: string
    rol: string
    resetTokenExpiry: Date | null
  } | null>

  createUser(data: {
    nombre: string
    email: string
    password: string
    rol: string
    cedula?: string
    clienteId?: string
  }): Promise<{ id: string; nombre: string; email: string; rol: string }>

  updatePassword(userId: string, hashedPassword: string): Promise<void>
  setResetToken(userId: string, token: string, expiry: Date): Promise<void>
  clearResetToken(userId: string): Promise<void>
}

export interface ITokenService {
  sign(payload: object, expiresIn: string): string
  verify(token: string): object
}

export interface IHashService {
  compare(plain: string, hashed: string): Promise<boolean>
  hash(plain: string): Promise<string>
}
