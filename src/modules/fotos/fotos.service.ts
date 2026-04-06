import { cloudinary } from '../../config/cloudinary'
import { prisma } from '../../config/prisma'
import { TipoFoto } from '@prisma/client'

interface UploadFotoParams {
  buffer: Buffer
  tipo: TipoFoto
  guiaId?: string
  rutaId?: string
}

export async function uploadFoto({ buffer, tipo, guiaId, rutaId }: UploadFotoParams) {
  // Subir a Cloudinary
  const folder = tipo === 'GUIA' ? 'medlogix/guias' : 'medlogix/hojas_ruta'

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, res) => {
      if (err || !res) return reject(err ?? new Error('Error al subir imagen'))
      resolve({ secure_url: res.secure_url, public_id: res.public_id })
    }).end(buffer)
  })

  return prisma.foto.create({
    data: {
      tipo,
      urlPreview: result.secure_url,
      publicId: result.public_id,
      guiaId: guiaId ?? null,
      rutaId: rutaId ?? null,
    },
  })
}

export async function deleteFoto(id: string) {
  const foto = await prisma.foto.findUniqueOrThrow({ where: { id } })

  // Eliminar de Cloudinary si tiene publicId
  if (foto.publicId) {
    await cloudinary.uploader.destroy(foto.publicId)
  }

  return prisma.foto.delete({ where: { id } })
}

export const getFotosByGuia = (guiaId: string) =>
  prisma.foto.findMany({ where: { guiaId } })

export const getFotosByRuta = (rutaId: string) =>
  prisma.foto.findMany({ where: { rutaId, tipo: 'HOJA_RUTA' } })
