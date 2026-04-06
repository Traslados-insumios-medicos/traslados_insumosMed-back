import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './novedades.controller'

const router = Router()

router.use(authenticate)

router.get('/', authorize('ADMIN'), ctrl.getAll)
router.get('/guia/:guiaId', authorize('ADMIN', 'CHOFER', 'CLIENTE'), ctrl.getByGuia)
router.get('/:id', authorize('ADMIN', 'CHOFER'), ctrl.getById)
router.post('/', authorize('CHOFER'), ctrl.create)
router.post('/:id/seguimiento', authorize('ADMIN'), ctrl.addSeguimiento)

export default router
