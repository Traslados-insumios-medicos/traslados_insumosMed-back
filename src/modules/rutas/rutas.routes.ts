import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './rutas.controller'

const router = Router()

router.use(authenticate)

router.get('/', authorize('ADMIN'), ctrl.getAll)
router.get('/mis-rutas', authorize('CHOFER'), ctrl.getMisRutas)
router.get('/:id', authorize('ADMIN', 'CHOFER'), ctrl.getById)
router.post('/', authorize('ADMIN'), ctrl.create)
router.patch('/:id/estado', authorize('ADMIN', 'CHOFER'), ctrl.updateEstado)
router.patch('/:id/asignar-chofer', authorize('ADMIN'), ctrl.assignChofer)

export default router
