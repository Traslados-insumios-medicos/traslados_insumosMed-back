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
  } | null>

  findUserById(id: string): Promise<{
    id: string
    nombre: string
    email: string
    rol: string
    clienteId: string | null
    activo: boolean
  } | null>
}

export interface ITokenService {
  sign(payload: object, expiresIn: string): string
  verify(token: string): object
}

export interface IHashService {
  compare(plain: string, hashed: string): Promise<boolean>
}
