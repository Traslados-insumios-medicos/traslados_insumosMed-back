/**
 * Public API for the auth module.
 * Re-exports the use-cases instance and the generarPasswordTemporal utility
 * so it can be imported and tested independently.
 */
export { authUseCases as authService } from './infrastructure/auth.container'
export { generarPasswordTemporal } from './application/auth.use-cases'
