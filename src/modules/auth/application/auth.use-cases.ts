/**
 * APPLICATION LAYER — Use Cases
 * Orquesta la lógica de negocio usando los puertos del dominio.
 * No conoce Express, Prisma ni JWT directamente.
 */
import { IAuthRepository, ITokenService, IHashService } from '../domain/auth.port'
import { AuthResult } from '../domain/auth.entity'
import { LoginDto } from '../auth.schema'

export class AuthUseCases {
  constructor(
    private readonly repo: IAuthRepository,
    private readonly tokenService: ITokenService,
    private readonly hashService: IHashService,
    private readonly jwtExpiresIn: string,
  ) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const usuario = await this.repo.findUserByEmail(dto.email)
    if (!usuario || !usuario.activo) throw new Error('Credenciales inválidas')

    const valid = await this.hashService.compare(dto.password, usuario.password)
    if (!valid) throw new Error('Credenciales inválidas')

    const token = this.tokenService.sign(
      { userId: usuario.id, rol: usuario.rol, clienteId: usuario.clienteId ?? undefined },
      this.jwtExpiresIn,
    )

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

  async me(userId: string) {
    const usuario = await this.repo.findUserById(userId)
    if (!usuario) throw new Error('Usuario no encontrado')
    return usuario
  }
}
