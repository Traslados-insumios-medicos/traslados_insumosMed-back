/**
 * INFRASTRUCTURE LAYER — Adapter: JWT Token Service
 * Implementa ITokenService usando jsonwebtoken.
 */
import jwt from 'jsonwebtoken'
import { env } from '../../../config/env'
import { ITokenService } from '../domain/auth.port'

export class JwtTokenService implements ITokenService {
  sign(payload: object, expiresIn: string): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any })
  }

  verify(token: string): object {
    return jwt.verify(token, env.JWT_SECRET) as object
  }
}
