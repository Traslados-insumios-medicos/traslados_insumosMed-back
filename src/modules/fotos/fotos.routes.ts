import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import { upload } from './fotos.upload'
import * as ctrl from './fotos.controller'

const router = Router()

router.use(authenticate)

router.get('/guia/:guiaId', ctrl.getByGuia)
router.get('/ruta/:rutaId', ctrl.getByRuta)
router.post('/guia/:guiaId', authorize('CHOFER'), upload.single('foto'), ctrl.uploadToGuia)
router.post('/ruta/:rutaId', authorize('CHOFER'), upload.single('foto'), ctrl.uploadToRuta)
router.delete('/:id', authorize('CHOFER', 'ADMIN'), ctrl.deleteFoto)

export default router
