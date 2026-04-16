import multer from 'multer'
import { AppError } from '../../utils/app-error'

// Usamos memoria para luego subir a Cloudinary desde el service
const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo por foto
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase()
    const ext = String(file.originalname || '').toLowerCase()
    const isGifByMime = mime === 'image/gif'
    const isGifByExt = ext.endsWith('.gif')
    if (isGifByMime || isGifByExt) {
      cb(new AppError(400, 'Formato no permitido: GIF. Solo se aceptan JPG, PNG o WEBP.'))
      return
    }

    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
    if (allowed.has(mime)) {
      cb(null, true)
      return
    }

    cb(new AppError(400, 'Solo se permiten imágenes JPG, PNG o WEBP.'))
  },
})
