import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, register, changePassword, me, generateTempPassword } from './auth.controller'
import { authenticate, authorize } from '../../middlewares/auth.middleware'

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de login. Intente de nuevo en un minuto.' },
})

const router = Router()

router.post('/login', loginLimiter, login)
router.post('/register', authenticate, authorize('ADMIN'), register)
router.post('/change-password', authenticate, changePassword)
router.post('/generate-temp-password/:userId', authenticate, authorize('ADMIN'), generateTempPassword)
router.get('/me', authenticate, me)

export default router
