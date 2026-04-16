import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { UpdateEstadoGuiaDto, UpdateDetalleGuiaDto } from './guias.schema'
import { emitWebhookEventAsync } from '../webhooks/webhooks.service'
import { getIo } from '../../websocket'

const rutaMini = {
  select: {
    id: true,
    fecha: true,
    estado: true,
    seguimientoChofer: true,
    choferId: true,
    chofer: { select: { id: true, nombre: true } },
  },
} as const

const guiaIncludeDetail = {
  cliente: { select: { id: true, nombre: true } },
  stop: true,
  fotos: true,
  novedades: { include: { seguimientos: true } },
  ruta: rutaMini,
}

const guiaListInclude = {
  cliente: { select: { id: true, nombre: true } },
  stop: { select: { id: true, orden: true, direccion: true, lat: true, lng: true } },
  ruta: rutaMini,
}

/** IDs de clientes cuyas guías puede ver el usuario del panel (principal + secundarios). */
export async function resolveAlcanceClienteIds(clienteUsuarioId: string): Promise<string[]> {
  const c = await prisma.cliente.findUnique({ where: { id: clienteUsuarioId } })
  if (!c) return [clienteUsuarioId]
  if (c.tipo === 'PRINCIPAL') {
    const sec = await prisma.cliente.findMany({
      where: { clientePrincipalId: c.id },
      select: { id: true },
    })
    return [c.id, ...sec.map((s) => s.id)]
  }
  return [c.id]
}

export const getById = (id: string) =>
  prisma.guiaEntrega.findUniqueOrThrow({ where: { id }, include: guiaIncludeDetail })

export type VistaMisEnvios = 'activos' | 'historial' | 'todos'

export interface MisEnviosQuery {
  clienteUsuarioId: string
  search?: string
  page?: number
  limit?: number
  vista?: VistaMisEnvios
}

function buildWhereMisEnvios(
  alcance: string[],
  search: string | undefined,
  vista: VistaMisEnvios,
): Prisma.GuiaEntregaWhereInput {
  const where: Prisma.GuiaEntregaWhereInput = { clienteId: { in: alcance } }
  const parts: Prisma.GuiaEntregaWhereInput[] = []

  if (search?.trim()) {
    const q = search.trim()
    parts.push({
      OR: [
        { numeroGuia: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
      ],
    })
  }

  if (vista === 'activos') {
    parts.push({
      AND: [
        { estado: 'PENDIENTE' }, // Solo guías pendientes
        { ruta: { estado: 'EN_CURSO' } }, // Y que la ruta esté en curso
      ],
    })
  } else if (vista === 'historial') {
    parts.push({ 
      OR: [
        { estado: 'ENTREGADO' },
        { estado: 'INCIDENCIA' },
      ],
    })
  }

  if (parts.length) where.AND = parts
  return where
}

export async function getMisEnviosList(q: MisEnviosQuery) {
  const { clienteUsuarioId, search, page = 1, limit = 10, vista = 'todos' } = q
  const alcance = await resolveAlcanceClienteIds(clienteUsuarioId)
  const take = Math.max(1, Math.min(100, limit))
  const skip = (Math.max(1, page) - 1) * take
  const where = buildWhereMisEnvios(alcance, search, vista)

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const baseAlcance = { clienteId: { in: alcance } } satisfies Prisma.GuiaEntregaWhereInput

  const [
    data,
    total,
    activas,
    entregadosHoy,
    incidencias,
    clienteRow,
  ] = await Promise.all([
    prisma.guiaEntrega.findMany({
      where,
      include: guiaListInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.guiaEntrega.count({ where }),
    prisma.guiaEntrega.count({
      where: {
        ...baseAlcance,
        OR: [
          { estado: { in: ['PENDIENTE', 'INCIDENCIA'] } },
          { ruta: { estado: 'EN_CURSO' } },
        ],
      },
    }),
    prisma.guiaEntrega.count({
      where: {
        ...baseAlcance,
        estado: 'ENTREGADO',
        updatedAt: { gte: startOfDay },
      },
    }),
    prisma.guiaEntrega.count({
      where: { ...baseAlcance, estado: 'INCIDENCIA' },
    }),
    prisma.cliente.findUnique({
      where: { id: clienteUsuarioId },
      select: { nombre: true },
    }),
  ])

  return {
    data,
    total,
    page: Math.max(1, page),
    limit: take,
    resumen: {
      activas,
      entregadosHoy,
      incidencias,
      nombreEmpresa: clienteRow?.nombre ?? 'Cliente',
    },
  }
}

export const updateEstado = async (id: string, dto: UpdateEstadoGuiaDto) => {
  const guia = await prisma.guiaEntrega.update({ where: { id }, data: { estado: dto.estado } })
  emitWebhookEventAsync('guia.estado_updated', {
    id: guia.id,
    numeroGuia: guia.numeroGuia,
    estado: guia.estado,
    rutaId: guia.rutaId,
    clienteId: guia.clienteId,
    stopId: guia.stopId,
  })
  
  // Emitir evento de socket cuando hay incidencia
  if (dto.estado === 'INCIDENCIA' && guia.rutaId) {
    try {
      getIo().to(`ruta:${guia.rutaId}`).emit('guia:incidencia', {
        guiaId: guia.id,
        numeroGuia: guia.numeroGuia,
        rutaId: guia.rutaId,
      })
    } catch {
      // Socket no disponible
    }
  }
  
  // Emitir evento cuando se entrega
  if (dto.estado === 'ENTREGADO' && guia.rutaId) {
    try {
      getIo().to(`ruta:${guia.rutaId}`).emit('guia:entregada', {
        guiaId: guia.id,
        numeroGuia: guia.numeroGuia,
        rutaId: guia.rutaId,
      })
    } catch {
      // Socket no disponible
    }
  }
  
  return guia
}

export const updateDetalle = async (id: string, dto: UpdateDetalleGuiaDto) => {
  const guia = await prisma.guiaEntrega.update({
    where: { id },
    data: dto,
    select: {
      id: true,
      numeroGuia: true,
      clienteId: true,
      rutaId: true,
      stopId: true,
      receptorNombre: true,
      horaLlegada: true,
      horaSalida: true,
      temperatura: true,
      observaciones: true,
      updatedAt: true,
      estado: true,
    },
  })
  
  // Si es una incidencia y tiene el formato "INCIDENCIA: TIPO", crear novedad automáticamente
  if (guia.estado === 'INCIDENCIA' && guia.receptorNombre?.startsWith('INCIDENCIA:')) {
    const tipoIncidencia = guia.receptorNombre.replace('INCIDENCIA:', '').trim() as 'CLIENTE_AUSENTE' | 'MERCADERIA_DANADA' | 'DIRECCION_INCORRECTA' | 'OTRO'
    
    // Verificar si ya existe una novedad para esta guía
    const novedadExistente = await prisma.novedad.findFirst({
      where: { guiaId: guia.id },
    })
    
    if (!novedadExistente) {
      const descripcionNovedad = guia.observaciones || 
        (tipoIncidencia === 'CLIENTE_AUSENTE' ? 'Cliente no estuvo presente en el momento de la entrega' :
         tipoIncidencia === 'MERCADERIA_DANADA' ? 'La mercadería presenta daños' :
         tipoIncidencia === 'DIRECCION_INCORRECTA' ? 'La dirección proporcionada es incorrecta' :
         'Otra incidencia reportada por el chofer')
      
      await prisma.novedad.create({
        data: {
          tipo: tipoIncidencia,
          descripcion: descripcionNovedad,
          guiaId: guia.id,
        },
      })
      
      console.log(`✅ Novedad creada automáticamente para guía ${guia.numeroGuia} - Tipo: ${tipoIncidencia}`)
    }
  }
  
  emitWebhookEventAsync('guia.detalle_updated', guia)
  return guia
}
