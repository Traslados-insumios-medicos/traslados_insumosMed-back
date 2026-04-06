import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './usuarios.controller'

const router = Router()

router.use(authenticate)

// GET /usuarios?rol=CHOFER  → lista choferes
router.get('/', authorize('ADMIN'), ctrl.getAll)
router.get('/:id', authorize('ADMIN'), ctrl.getById)
router.post('/', authorize('ADMIN'), ctrl.create)
router.put('/:id', authorize('ADMIN'), ctrl.update)
router.patch('/:id/toggle-activo', authorize('ADMIN'), ctrl.toggleActivo)

export default router
