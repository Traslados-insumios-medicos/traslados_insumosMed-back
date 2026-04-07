import { IAuthRepository, ITokenService, IHashService } from '../domain/auth.port'
import { AuthResult } from '../domain/auth.entity'
import { LoginDto, RegisterDto, ChangePasswordDto } from '../auth.schema'
import { AppError } from '../../../utils/app-error'

export function generarPasswordTemporal(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `Medlogix${num}!`
}

export class AuthUseCases {
  constructor(
    private readonly repo: IAuthRepository,
    private readonly tokenService: ITokenService,
    private readonly hashService: IHashService,
    private readonly jwtExpiresIn: string,
  ) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const usuario = await this.repo.findUserByEmail(dto.email)
    if (!usuario || !usuario.activo) {
      throw new AppError(401, 'Credenciales inválidas')
    }

    const valid = await this.hashService.compare(dto.password, usuario.password)
    if (!valid) {
      throw new AppError(401, 'Credenciales inválidas')
    }

    const token = this.tokenService.sign(
      { userId: usuario.id, rol: usuario.rol, clienteId: usuario.clienteId ?? undefined },
      this.jwtExpiresIn,
    )

    return {
      token,
      mustChangePassword: usuario.mustChangePassword,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        clienteId: usuario.clienteId,
      },
    }
  }

  async register(dto: RegisterDto) {
    const existe = await this.repo.findUserByEmail(dto.email)
    if (existe) {
      throw new AppError(409, 'Ya existe un usuario con ese email')
    }

    const passwordTemporal = generarPasswordTemporal()
    const hashedPassword = await this.hashService.hash(passwordTemporal)

    const usuario = await this.repo.createUser({ ...dto, password: hashedPassword })

    // Devolvemos la contraseña temporal en texto plano — solo esta vez
    return { usuario, passwordTemporal }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const usuario = await this.repo.findUserById(userId)
    if (!usuario) {
      throw new AppError(404, 'Usuario no encontrado')
    }

    // Necesitamos el password hasheado, buscamos por email
    const usuarioConPassword = await this.repo.findUserByEmail(usuario.email)
    if (!usuarioConPassword) {
      throw new AppError(404, 'Usuario no encontrado')
    }

    const valid = await this.hashService.compare(dto.passwordActual, usuarioConPassword.password)
    if (!valid) {
      throw new AppError(400, 'La contraseña actual es incorrecta')
    }

    const nuevoHash = await this.hashService.hash(dto.passwordNueva)
    await this.repo.updatePassword(userId, nuevoHash)

    const token = this.tokenService.sign(
      { userId: usuario.id, rol: usuario.rol, clienteId: usuario.clienteId ?? undefined },
      this.jwtExpiresIn,
    )
    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } }
  }

  async me(userId: string) {
    const usuario = await this.repo.findUserById(userId)
    if (!usuario) {
      throw new AppError(404, 'Usuario no encontrado')
    }
    return usuario
  }
}
