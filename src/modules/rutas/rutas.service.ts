import { prisma } from '../../config/prisma'
import { CreateRutaDto, UpdateEstadoDto } from './rutas.schema'

const rutaInclude = {
  chofer: { select: { id: true, nombre: true } },
  stops: {
    orderBy: { orden: 'asc' as const },
    include: {
      cliente: { select: { id: true, nombre: true } },
      guias: true,
    },
  },
  guias: true,
  fotos: { where: { tipo: 'HOJA_RUTA' as const } },
}

export const getAll = () =>
  prisma.ruta.findMany({ include: rutaInclude, orderBy: { createdAt: 'desc' } })

export const getById = (id: string) =>
  prisma.ruta.findUniqueOrThrow({ where: { id }, include: rutaInclude })

export const getByChofer = (choferId: string) =>
  prisma.ruta.findMany({ where: { choferId }, include: rutaInclude, orderBy: { fecha: 'desc' } })

export const create = async (dto: CreateRutaDto) => {
  // Genera un número de guía secuencial por stop
  const count = await prisma.guiaEntrega.count()

  return prisma.ruta.create({
    data: {
      fecha: dto.fecha,
      choferId: dto.choferId,
      stops: {
        create: dto.stops.map((s, i) => ({
          orden: s.orden,
          direccion: s.direccion,
          lat: s.lat,
          lng: s.lng,
          clienteId: s.clienteId,
          notas: s.notas,
          guias: {
            create: {
              numeroGuia: `G-${String(count + i + 1).padStart(4, '0')}`,
              descripcion: s.guiaDescripcion ?? 'Insumos médicos',
              clienteId: s.clienteId,
            },
          },
        })),
      },
    },
    include: rutaInclude,
  })
}

export const updateEstado = (id: string, dto: UpdateEstadoDto) =>
  prisma.ruta.update({ where: { id }, data: { estado: dto.estado } })

export const assignChofer = (id: string, choferId: string) =>
  prisma.ruta.update({ where: { id }, data: { choferId } })
