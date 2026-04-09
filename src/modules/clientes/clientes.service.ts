import { Prisma, TipoCliente, Rol } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/app-error'
import { CreateClienteDto, UpdateClienteDto } from './clientes.schema'
import { emitWebhookEventAsync } from '../webhooks/webhooks.service'

const clienteInclude = {
  clientePrincipal: { select: { id: true, nombre: true } },
  clientesSecundarios: { select: { id: true, nombre: true, ruc: true, activo: true } },
} satisfies Prisma.ClienteInclude

export const getAll = async (page = 1, limit = 20, tipo?: TipoCliente) => {
  const skip = (page - 1) * limit
  const where: Prisma.ClienteWhereInput = tipo ? { tipo } : {}
  const [data, total] = await Promise.all([
    prisma.cliente.findMany({ where, include: clienteInclude, orderBy: { nombre: 'asc' }, skip, take: limit }),
    prisma.cliente.count({ where }),
  ])
  return { data, total, page, limit }
}

export const getById = (id: string) =>
  prisma.cliente.findUniqueOrThrow({ where: { id }, include: clienteInclude })

export const create = async (dto: CreateClienteDto) => {
  const existing = await prisma.cliente.findUnique({ where: { ruc: dto.ruc } })
  if (existing) throw new AppError(409, `Ya existe un cliente con el RUC ${dto.ruc}`)

  if (dto.tipo === 'SECUNDARIO' && dto.clientePrincipalId) {
    const principal = await prisma.cliente.findUnique({ where: { id: dto.clientePrincipalId } })
    if (!principal) throw new AppError(404, 'Cliente principal no encontrado')
    if (principal.tipo !== 'PRINCIPAL') throw new AppError(400, 'El cliente referenciado no es PRINCIPAL')
  }

  const created = await prisma.cliente.create({ data: dto as Prisma.ClienteCreateInput, include: clienteInclude })
  emitWebhookEventAsync('cliente.created', {
    id: created.id,
    nombre: created.nombre,
    tipo: created.tipo,
    activo: created.activo,
    clientePrincipalId: created.clientePrincipalId ?? null,
  })
  return created
}

export const update = async (id: string, dto: UpdateClienteDto) => {
  const updated = await prisma.cliente.update({ where: { id }, data: dto as Prisma.ClienteUpdateInput, include: clienteInclude })
  emitWebhookEventAsync('cliente.updated', {
    id: updated.id,
    nombre: updated.nombre,
    tipo: updated.tipo,
    activo: updated.activo,
    clientePrincipalId: updated.clientePrincipalId ?? null,
  })
  return updated
}

export const toggleActivo = async (id: string) => {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
  const updated = await prisma.cliente.update({ where: { id }, data: { activo: !cliente.activo }, include: clienteInclude })
  emitWebhookEventAsync('cliente.activo_toggled', {
    id: updated.id,
    nombre: updated.nombre,
    activo: updated.activo,
  })
  return updated
}

/** Elimina guías, paradas y usuarios cliente; secundarios primero si es principal; rutas huérfanas. */
async function removeClienteTx(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<{ id: string; nombre: string; tipo: TipoCliente }[]> {
  const cliente = await tx.cliente.findUnique({
    where: { id },
    include: { clientesSecundarios: { select: { id: true } } },
  })
  if (!cliente) throw new AppError(404, 'Cliente no encontrado')

  const deletedMeta: { id: string; nombre: string; tipo: TipoCliente }[] = []

  if (cliente.tipo === 'PRINCIPAL' && cliente.clientesSecundarios.length > 0) {
    for (const s of cliente.clientesSecundarios) {
      deletedMeta.push(...(await removeClienteTx(tx, s.id)))
    }
  }

  await tx.guiaEntrega.deleteMany({ where: { clienteId: id } })
  await tx.stop.deleteMany({ where: { clienteId: id } })
  await tx.usuario.deleteMany({ where: { clienteId: id, rol: Rol.CLIENTE } })

  const rutasVacias = await tx.ruta.findMany({
    where: { stops: { none: {} } },
    select: { id: true },
  })
  if (rutasVacias.length > 0) {
    const vaciaIds = rutasVacias.map((r) => r.id)
    await tx.$executeRaw`DELETE FROM ruta_seguimiento_logs WHERE ruta_id IN (${Prisma.join(vaciaIds)})`
    await tx.ruta.deleteMany({ where: { id: { in: vaciaIds } } })
  }

  await tx.cliente.delete({ where: { id } })
  deletedMeta.push({ id: cliente.id, nombre: cliente.nombre, tipo: cliente.tipo })
  return deletedMeta
}

export const remove = async (id: string) => {
  const deletedList = await prisma.$transaction((tx) => removeClienteTx(tx, id))
  for (const meta of deletedList) {
    emitWebhookEventAsync('cliente.deleted', {
      id: meta.id,
      nombre: meta.nombre,
      tipo: meta.tipo,
    })
  }
}
