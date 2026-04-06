import multer from 'multer'

// Usamos memoria para luego subir a Cloudinary desde el service
const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo por foto
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes'))
    }
  },
})
