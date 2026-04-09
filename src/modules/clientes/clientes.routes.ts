import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './clientes.controller'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.getAll)
router.get('/:id', ctrl.getById)
router.post('/', authorize('ADMIN'), ctrl.create)
router.put('/:id', authorize('ADMIN'), ctrl.update)
router.patch('/:id/toggle-activo', authorize('ADMIN'), ctrl.toggleActivo)
router.delete('/:id', authorize('ADMIN'), ctrl.remove)

export default router
