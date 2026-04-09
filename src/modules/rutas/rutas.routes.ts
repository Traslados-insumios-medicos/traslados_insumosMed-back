import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './rutas.controller'

const router = Router()

router.use(authenticate)

// GET /api/rutas — ADMIN sees all (with filters), CHOFER sees only their own
router.get('/', authorize('ADMIN', 'CHOFER'), ctrl.getAll)
router.get('/:id', authorize('ADMIN', 'CHOFER', 'CLIENTE'), ctrl.getById)
router.get('/:id/seguimiento-historial', authorize('ADMIN', 'CHOFER', 'CLIENTE'), ctrl.getSeguimientoHistory)
router.post('/', authorize('ADMIN'), ctrl.create)
router.patch('/:id/estado', authorize('ADMIN', 'CHOFER'), ctrl.updateEstado)
router.patch('/:id/seguimiento', authorize('CHOFER'), ctrl.updateSeguimientoChofer)
router.patch('/:id/asignar-chofer', authorize('ADMIN'), ctrl.assignChofer)

export default router
