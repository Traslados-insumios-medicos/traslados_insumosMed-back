import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import * as ctrl from './reportes.controller'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/clientes', ctrl.porCliente)
router.get('/choferes', ctrl.porChofer)
router.get('/fechas', ctrl.porFecha)

export default router
