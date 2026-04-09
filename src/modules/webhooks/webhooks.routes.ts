import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './webhooks.controller'

const router = Router()

router.use(authenticate)
router.get('/health', authorize('ADMIN'), ctrl.health)

export default router
