import { Prisma, TipoCliente, Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  ensureRutaSeguimientoLogsTable,
  deleteRutasInTransaction,
} from "../../db/rutaHardDelete";
import { AppError } from "../../utils/app-error";
import { CreateClienteDto, UpdateClienteDto } from "./clientes.schema";
import { emitWebhookEventAsync } from "../webhooks/webhooks.service";
import { normalizeCiudad } from "../../utils/normalize-ciudad";

function withNormalizedCiudad<T extends { ciudad?: string | null }>(
  dto: T,
): T & { ciudad?: string | null } {
  if (!("ciudad" in dto)) return dto;
  return { ...dto, ciudad: normalizeCiudad(dto.ciudad) };
}

const clienteInclude = {
  clientePrincipal: { select: { id: true, nombre: true } },
  clientesSecundarios: {
    select: {
      id: true,
      nombre: true,
      ruc: true,
      activo: true,
      direccion: true,
      ciudad: true,
      lat: true,
      lng: true,
    },
  },
  usuarios: {
    where: { rol: Rol.CLIENTE },
    select: { id: true, nombre: true, email: true, activo: true },
  },
} satisfies Prisma.ClienteInclude;

export const getAll = async (
  page = 1,
  limit = 10,
  tipo?: TipoCliente,
  activo?: boolean,
  search?: string,
  ciudad?: string,
) => {
  const skip = (page - 1) * limit;
  const where: Prisma.ClienteWhereInput = {};
  if (tipo) where.tipo = tipo;
  if (activo !== undefined) where.activo = activo;
  const ciudadNorm = normalizeCiudad(ciudad);
  if (ciudadNorm) where.ciudad = { equals: ciudadNorm, mode: "insensitive" };
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { ruc: { contains: q, mode: "insensitive" } },
      { emailContacto: { contains: q, mode: "insensitive" } },
      { ciudad: { contains: q, mode: "insensitive" } },
    ];
  }

  const [data, total, totalActivos] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: clienteInclude,
      orderBy: { nombre: "asc" },
      skip,
      take: limit,
    }),
    prisma.cliente.count({ where }),
    prisma.cliente.count({
      where: {
        ...(tipo ? { tipo } : {}),
        ...(activo !== undefined ? { activo } : {}),
        activo: true,
      },
    }),
  ]);
  return { data, total, page, limit, totalActivos };
};

export const getById = (id: string) =>
  prisma.cliente.findUniqueOrThrow({ where: { id }, include: clienteInclude });

export const getCiudadesDistinct = async () => {
  const rows = await prisma.cliente.findMany({
    where: { ciudad: { not: null } },
    select: { ciudad: true },
    distinct: ["ciudad"],
    orderBy: { ciudad: "asc" },
  });
  return rows
    .map((r) => r.ciudad)
    .filter((c): c is string => Boolean(c));
};

export const create = async (dto: CreateClienteDto) => {
  const data = withNormalizedCiudad(dto);
  const existing = await prisma.cliente.findUnique({ where: { ruc: data.ruc } });
  if (existing)
    throw new AppError(409, `Ya existe un cliente con el RUC ${data.ruc}`);

  // Validar nombre único
  const existingNombre = await prisma.cliente.findFirst({
    where: { nombre: data.nombre },
  });
  if (existingNombre)
    throw new AppError(
      409,
      `Ya existe un cliente con el nombre "${data.nombre}"`,
    );

  if (data.tipo === "SECUNDARIO" && data.clientePrincipalId) {
    const principal = await prisma.cliente.findUnique({
      where: { id: data.clientePrincipalId },
    });
    if (!principal) throw new AppError(404, "Cliente principal no encontrado");
    if (principal.tipo !== "PRINCIPAL")
      throw new AppError(400, "El cliente referenciado no es PRINCIPAL");
  }

  const created = await prisma.cliente.create({
    data: data as Prisma.ClienteCreateInput,
    include: clienteInclude,
  });
  emitWebhookEventAsync("cliente.created", {
    id: created.id,
    nombre: created.nombre,
    tipo: created.tipo,
    activo: created.activo,
    clientePrincipalId: created.clientePrincipalId ?? null,
  });
  return created;
};

export const update = async (id: string, dto: UpdateClienteDto) => {
  const data = withNormalizedCiudad(dto);
  // Validar nombre único si se está actualizando
  if (data.nombre) {
    const existingNombre = await prisma.cliente.findFirst({
      where: {
        nombre: data.nombre,
        NOT: { id },
      },
    });
    if (existingNombre)
      throw new AppError(
        409,
        `Ya existe otro cliente con el nombre "${data.nombre}"`,
      );
  }

  // Validar RUC único si se está actualizando
  if (data.ruc) {
    const existingRuc = await prisma.cliente.findFirst({
      where: {
        ruc: data.ruc,
        NOT: { id },
      },
    });
    if (existingRuc)
      throw new AppError(409, `Ya existe otro cliente con el RUC ${data.ruc}`);
  }

  // Detectar cambio de PRINCIPAL a SECUNDARIO para eliminar usuario de acceso
  if (data.tipo === "SECUNDARIO") {
    const currentCliente = await prisma.cliente.findUnique({ where: { id } });
    if (currentCliente && currentCliente.tipo === "PRINCIPAL") {
      // Eliminar usuario de acceso asociado
      await prisma.usuario.deleteMany({
        where: {
          clienteId: id,
          rol: Rol.CLIENTE,
        },
      });
    }
  }

  const updated = await prisma.cliente.update({
    where: { id },
    data: data as Prisma.ClienteUpdateInput,
    include: clienteInclude,
  });
  emitWebhookEventAsync("cliente.updated", {
    id: updated.id,
    nombre: updated.nombre,
    tipo: updated.tipo,
    activo: updated.activo,
    clientePrincipalId: updated.clientePrincipalId ?? null,
  });
  return updated;
};

export const toggleActivo = async (id: string) => {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } });
  const newActivo = !cliente.activo;

  const updated = await prisma.cliente.update({
    where: { id },
    data: { activo: newActivo },
    include: clienteInclude,
  });

  // Si es un cliente PRINCIPAL, también actualizar el estado del usuario asociado
  if (cliente.tipo === "PRINCIPAL") {
    const usuario = await prisma.usuario.findFirst({
      where: {
        clienteId: id,
        rol: Rol.CLIENTE,
      },
    });

    if (usuario) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { activo: newActivo },
      });

      // Si se desactivó, emitir evento WebSocket para desconectar al usuario
      if (!newActivo) {
        const { emitAccountDeactivated } = await import("../../websocket");
        emitAccountDeactivated(usuario.id);
      }
    }
  }

  emitWebhookEventAsync("cliente.activo_toggled", {
    id: updated.id,
    nombre: updated.nombre,
    activo: updated.activo,
  });
  return updated;
};

/** Elimina guías, paradas y usuarios cliente; secundarios primero si es principal; rutas huérfanas. */
async function removeClienteTx(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<{ id: string; nombre: string; tipo: TipoCliente }[]> {
  const cliente = await tx.cliente.findUnique({
    where: { id },
    include: { clientesSecundarios: { select: { id: true } } },
  });
  if (!cliente) throw new AppError(404, "Cliente no encontrado");

  const deletedMeta: { id: string; nombre: string; tipo: TipoCliente }[] = [];

  if (cliente.tipo === "PRINCIPAL" && cliente.clientesSecundarios.length > 0) {
    for (const s of cliente.clientesSecundarios) {
      deletedMeta.push(...(await removeClienteTx(tx, s.id)));
    }
  }

  const rutaIdsTouched = [
    ...new Set(
      (
        await tx.stop.findMany({
          where: { clienteId: id },
          select: { rutaId: true },
        })
      ).map((s) => s.rutaId),
    ),
  ];

  /* Relación stop.clienteId cubre guías mal alineadas (clienteId distinto pero parada de este cliente). */
  await tx.guiaEntrega.deleteMany({
    where: {
      OR: [{ clienteId: id }, { stop: { clienteId: id } }],
    },
  });

  await tx.stop.deleteMany({ where: { clienteId: id } });

  await tx.usuario.deleteMany({ where: { clienteId: id, rol: Rol.CLIENTE } });
  await tx.usuario.updateMany({
    where: { clienteId: id },
    data: { clienteId: null },
  });

  /* Solo rutas que tenían paradas de este cliente y quedaron sin paradas (no barrer TODAS las rutas vacías del sistema). */
  for (const rutaId of rutaIdsTouched) {
    const row = await tx.ruta.findFirst({
      where: { id: rutaId, stops: { none: {} } },
      select: { id: true },
    });
    if (row) await deleteRutasInTransaction(tx, [row.id]);
  }

  await tx.cliente.delete({ where: { id } });
  deletedMeta.push({
    id: cliente.id,
    nombre: cliente.nombre,
    tipo: cliente.tipo,
  });
  return deletedMeta;
}

export const remove = async (id: string) => {
  await ensureRutaSeguimientoLogsTable();
  const deletedList = await prisma.$transaction(
    (tx) => removeClienteTx(tx, id),
    {
      maxWait: 10_000,
      timeout: 60_000,
    },
  );
  for (const meta of deletedList) {
    emitWebhookEventAsync("cliente.deleted", {
      id: meta.id,
      nombre: meta.nombre,
      tipo: meta.tipo,
    });
  }
};
