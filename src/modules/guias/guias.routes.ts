import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './guias.controller'

const router = Router()

router.use(authenticate)

router.get('/mis-envios', authorize('CLIENTE'), ctrl.getMisEnvios)
router.get('/:id', authorize('ADMIN', 'CHOFER', 'CLIENTE'), ctrl.getById)
router.patch('/:id/estado', authorize('CHOFER', 'ADMIN'), ctrl.updateEstado)
router.patch('/:id/detalle', authorize('CHOFER'), ctrl.updateDetalle)
/** Alias acordado en plan (K-07): mismo comportamiento que /detalle */
router.patch('/:id/detalle-entrega', authorize('CHOFER'), ctrl.updateDetalle)

export default router
