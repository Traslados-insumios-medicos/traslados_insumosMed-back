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
}
