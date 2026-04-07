/**
 * INFRASTRUCTURE LAYER — Adapter: Bcrypt Hash Service
 * Implementa IHashService usando bcryptjs.
 */
import bcrypt from 'bcryptjs'
import { IHashService } from '../domain/auth.port'

export class BcryptHashService implements IHashService {
  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed)
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10)
  }
}
