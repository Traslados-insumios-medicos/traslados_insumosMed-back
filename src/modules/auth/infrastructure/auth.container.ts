/**
 * INFRASTRUCTURE LAYER — Dependency Injection Container
 * Ensambla los adaptadores con los casos de uso (Composition Root).
 */
import { AuthUseCases } from '../application/auth.use-cases'
import { AuthPrismaRepository } from './auth.prisma-repository'
import { JwtTokenService } from './auth.jwt-service'
import { BcryptHashService } from './auth.bcrypt-service'
import { env } from '../../../config/env'

const repo = new AuthPrismaRepository()
const tokenService = new JwtTokenService()
const hashService = new BcryptHashService()

export const authUseCases = new AuthUseCases(repo, tokenService, hashService, env.JWT_EXPIRES_IN)
