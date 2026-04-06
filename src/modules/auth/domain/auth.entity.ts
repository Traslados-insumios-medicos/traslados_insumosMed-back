/**
 * DOMAIN LAYER — Auth Entity
 * Representa el agregado de autenticación. Sin dependencias externas.
 */
export interface AuthPayload {
  userId: string
  rol: string
  clienteId?: string
}

export interface AuthResult {
  token: string
  usuario: {
    id: string
    nombre: string
    email: string
    rol: string
    clienteId: string | null
  }
}
