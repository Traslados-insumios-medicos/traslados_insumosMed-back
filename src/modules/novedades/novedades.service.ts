import { prisma } from '../../config/prisma'
import { CreateNovedadDto, CreateSeguimientoDto } from './novedades.schema'

const novedadInclude = {
  guia: { 
    select: { 
      id: true, 
      numeroGuia: true, 
      clienteId: true,
      descripcion: true,
      estado: true,
      receptorNombre: true,
      ruta: {
        select: {
          id: true,
          fecha: true,
          chofer: { select: { nombre: true } }
        }
      },
      stop: {
        select: {
          cliente: { select: { nombre: true } }
        }
      }
    } 
  },
  seguimientos: { orderBy: { createdAt: 'asc' as const } },
}

export const getAll = () =>
  prisma.novedad.findMany({ include: novedadInclude, orderBy: { createdAt: 'desc' } })

export const getById = (id: string) =>
  prisma.novedad.findUniqueOrThrow({ where: { id }, include: novedadInclude })

export const getByGuia = (guiaId: string) =>
  prisma.novedad.findMany({ where: { guiaId }, include: novedadInclude })

export const create = async (dto: CreateNovedadDto) => {
  const novedad = await prisma.novedad.create({ data: dto, include: novedadInclude })

  // Actualizar estado de la guía a INCIDENCIA automáticamente
  await prisma.guiaEntrega.update({ where: { id: dto.guiaId }, data: { estado: 'INCIDENCIA' } })

  return novedad
}

export const addSeguimiento = (novedadId: string, dto: CreateSeguimientoDto) =>
  prisma.seguimientoNovedad.create({ data: { novedadId, nota: dto.nota } })
