import crypto from "crypto";
import { EstadoRuta, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { normalizeCiudad } from "../../utils/normalize-ciudad";
import {
  deleteRutasInTransaction,
} from "../../db/rutaHardDelete";
import { AppError } from "../../utils/app-error";
import {
  CreateRutaDto,
  UpdateEstadoDto,
  UpdateSeguimientoChoferDto,
} from "./rutas.schema";
import { getIo } from "../../websocket";
import { emitWebhookEventAsync } from "../webhooks/webhooks.service";

interface SeguimientoRutaLog {
  id: string;
  rutaId: string;
  choferId: string;
  seguimientoChofer: string;
  createdAt: Date;
}

const rutaInclude = {
  chofer: { select: { id: true, nombre: true, cedula: true } },
  stops: {
    orderBy: { orden: "asc" as const },
    include: {
      cliente: { select: { id: true, nombre: true, ciudad: true } },
      guias: {
        include: {
          fotos: true,
          novedades: true,
        },
      },
    },
  },
  guias: {
    include: {
      fotos: true,
      novedades: true,
    },
  },
  fotos: { where: { tipo: "HOJA_RUTA" as const } },
};

export interface GetAllFilters {
  choferId?: string;
  fecha?: string;
  estado?: string;
  search?: string;
  ciudad?: string;
  page?: number;
  limit?: number;
}

export const getAll = async (filters: GetAllFilters = {}) => {
  const {
    choferId,
    fecha,
    estado,
    search,
    ciudad,
    page = 1,
    limit = 10,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.RutaWhereInput = {};
  if (choferId) where.choferId = choferId;
  if (fecha) where.fecha = fecha;
  if (estado) where.estado = estado as EstadoRuta;

  const ciudadNorm = normalizeCiudad(ciudad);
  if (ciudadNorm) {
    where.stops = {
      some: {
        cliente: { ciudad: { equals: ciudadNorm, mode: "insensitive" } },
      },
    };
  }

  if (search) {
    where.OR = [
      {
        hojaRuta: { contains: search, mode: "insensitive" },
      },
      {
        nombre: { contains: search, mode: "insensitive" },
      },
      {
        chofer: {
          nombre: { contains: search, mode: "insensitive" },
        },
      },
      {
        stops: {
          some: {
            cliente: {
              nombre: { contains: search, mode: "insensitive" },
            },
          },
        },
      },
      {
        stops: {
          some: {
            guias: {
              some: {
                receptorNombre: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.ruta.findMany({
      where,
      include: rutaInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ruta.count({ where }),
  ]);

  return { data, total, page, limit };
};

export const getById = async (id: string) => {
  const ruta = await prisma.ruta.findUnique({
    where: { id },
    include: rutaInclude,
  });
  if (!ruta) throw new AppError(404, "Ruta no encontrada");
  return ruta;
};

export const create = async (dto: CreateRutaDto) => {
  // Verify chofer exists
  const chofer = await prisma.usuario.findUnique({
    where: { id: dto.choferId },
  });
  if (!chofer) throw new AppError(404, "Chofer no encontrado");

  const created = await prisma.$transaction(
    async (tx: any) => {
      const ruta = await tx.ruta.create({
        data: {
          nombre: dto.nombre?.trim() || null,
          hojaRuta: dto.hojaRuta?.trim() || null,
          lugarOrigen: dto.lugarOrigen?.trim() || null,
          lugarDestino: dto.lugarDestino?.trim() || null,
          fecha: dto.fecha,
          choferId: dto.choferId,
        },
      });

      // Recopilar todos los numeroGuia no-nulos del payload para validar unicidad en batch (1 query)
      type GuiaInput = { descripcion: string; numeroGuia?: string };
      type StopGuiaPair = { stopIndex: number; guia: GuiaInput };
      const allGuiasPairs: StopGuiaPair[] = dto.stops.flatMap((s, si) => {
        const guiasInput: GuiaInput[] =
          s.guias && s.guias.length > 0
            ? s.guias
            : [{ descripcion: s.guiaDescripcion ?? "Insumos médicos" }];
        return guiasInput.map((g) => ({ stopIndex: si, guia: g }));
      });

      const numerosConValor = allGuiasPairs
        .map((p) => p.guia.numeroGuia?.trim())
        .filter((n): n is string => Boolean(n));

      // Detectar duplicados dentro del mismo payload
      const seenInPayload = new Set<string>();
      for (const n of numerosConValor) {
        if (seenInPayload.has(n)) {
          throw new AppError(
            409,
            `El número de guía "${n}" está repetido en el formulario`,
          );
        }
        seenInPayload.add(n);
      }

      // Validar unicidad contra la base de datos en una sola query (en lugar de N findFirst)
      if (numerosConValor.length > 0) {
        const existing = await tx.guiaEntrega.findFirst({
          where: { numeroGuia: { in: numerosConValor } },
          select: { numeroGuia: true },
        });
        if (existing) {
          throw new AppError(
            409,
            `El número de guía "${existing.numeroGuia}" ya existe`,
          );
        }
      }

      // Crear stops y guías — stops secuencial (necesita stopId), guías en batch por stop
      for (const s of dto.stops) {
        const stop = await tx.stop.create({
          data: {
            orden: s.orden,
            direccion: s.direccion,
            lat: s.lat ?? 0,
            lng: s.lng ?? 0,
            notas: s.notas,
            rutaId: ruta.id,
            clienteId: s.clienteId,
          },
        });

        const guiasInput: GuiaInput[] =
          s.guias && s.guias.length > 0
            ? s.guias
            : [{ descripcion: s.guiaDescripcion ?? "Insumos médicos" }];

        await tx.guiaEntrega.createMany({
          data: guiasInput.map((guia) => ({
            numeroGuia: guia.numeroGuia?.trim() || null,
            descripcion: guia.descripcion,
            clienteId: s.clienteId,
            rutaId: ruta.id,
            stopId: stop.id,
          })),
        });
      }

      // Return full ruta with includes
      const fullRuta = await tx.ruta.findUnique({
        where: { id: ruta.id },
        include: rutaInclude,
      });
      if (!fullRuta) throw new AppError(404, "Ruta no encontrada");
      return fullRuta;
    },
    { maxWait: 15_000, timeout: 120_000 },
  );
  emitWebhookEventAsync("ruta.created", {
    id: created.id,
    fecha: created.fecha,
    estado: created.estado,
    choferId: created.choferId,
    nombre: created.nombre,
    hojaRuta: created.hojaRuta,
    lugarOrigen: created.lugarOrigen,
    lugarDestino: created.lugarDestino,
    stops: created.stops.map((s: any) => ({
      id: s.id,
      orden: s.orden,
      clienteId: s.clienteId,
    })),
  });
  return created;
};

export const updateEstado = async (id: string, dto: UpdateEstadoDto) => {
  const data: any = { estado: dto.estado };
  if (dto.estado === "EN_CURSO") {
    data.seguimientoChofer = "NINGUNO";
  }
  if (
    dto.estado === "COMPLETADA" ||
    dto.estado === "CANCELADA" ||
    dto.estado === "PENDIENTE"
  ) {
    data.seguimientoChofer = "NINGUNO";
  }
  const updated = await prisma.ruta.update({
    where: { id },
    data,
    include: rutaInclude,
  });
  emitWebhookEventAsync("ruta.estado_updated", {
    id: updated.id,
    estado: updated.estado,
    seguimientoChofer: updated.seguimientoChofer,
    choferId: updated.choferId,
  });

  // Emitir evento de socket cuando la ruta se completa
  if (dto.estado === "COMPLETADA") {
    try {
      getIo().to(`ruta:${id}`).emit("ruta:completada", {
        rutaId: id,
        estado: dto.estado,
      });
    } catch {
      // Socket no disponible
    }
  }

  return updated;
};

export const updateSeguimientoChofer = async (
  rutaId: string,
  choferUserId: string,
  dto: UpdateSeguimientoChoferDto,
) => {
  const ruta = await prisma.ruta.findUnique({ where: { id: rutaId } });
  if (!ruta) throw new AppError(404, "Ruta no encontrada");
  if (ruta.choferId !== choferUserId) throw new AppError(403, "No autorizado");
  if (ruta.estado !== "EN_CURSO") {
    throw new AppError(
      400,
      "Solo puedes actualizar el seguimiento cuando la ruta está en curso",
    );
  }

  const seguimientoChofer = dto.seguimientoChofer;
  const updated = await prisma.ruta.update({
    where: { id: rutaId },
    data: { seguimientoChofer },
    include: rutaInclude,
  });

  try {
    getIo()
      .to(`ruta:${rutaId}`)
      .emit("seguimiento_ruta", { rutaId, seguimientoChofer });
  } catch {
    // Ignorar si WS no está listo (tests / arranque)
  }


  await prisma.$executeRaw`
    INSERT INTO ruta_seguimiento_logs (id, ruta_id, chofer_id, seguimiento_chofer)
    VALUES (${crypto.randomUUID()}, ${rutaId}, ${choferUserId}, ${seguimientoChofer})
  `;

  emitWebhookEventAsync("ruta.seguimiento_updated", {
    id: updated.id,
    seguimientoChofer: updated.seguimientoChofer,
    estado: updated.estado,
    choferId: updated.choferId,
  });

  return updated;
};

export const getSeguimientoHistory = async (
  rutaId: string,
  limit = 100,
): Promise<SeguimientoRutaLog[]> => {

  const max = Math.max(1, Math.min(500, limit));
  const rows = await prisma.$queryRaw<
    {
      id: string;
      ruta_id: string;
      chofer_id: string;
      seguimiento_chofer: string;
      created_at: Date;
    }[]
  >`
    SELECT id, ruta_id, chofer_id, seguimiento_chofer, created_at
    FROM ruta_seguimiento_logs
    WHERE ruta_id = ${rutaId}
    ORDER BY created_at DESC
    LIMIT ${max}
  `;
  return rows.map((r: any) => ({
    id: r.id,
    rutaId: r.ruta_id,
    choferId: r.chofer_id,
    seguimientoChofer: r.seguimiento_chofer,
    createdAt: r.created_at,
  }));
};

export const assignChofer = async (id: string, choferId: string) => {
  const chofer = await prisma.usuario.findUnique({ where: { id: choferId } });
  if (!chofer) throw new AppError(404, "Chofer no encontrado");
  const updated = await prisma.ruta.update({
    where: { id },
    data: { choferId },
    include: rutaInclude,
  });
  emitWebhookEventAsync("ruta.chofer_assigned", {
    id: updated.id,
    choferId: updated.choferId,
    estado: updated.estado,
  });
  return updated;
};

export const remove = async (id: string) => {
  const ruta = await prisma.ruta.findUnique({
    where: { id },
    select: { id: true, choferId: true, fecha: true },
  });
  if (!ruta) throw new AppError(404, "Ruta no encontrada");

  await prisma.$transaction(
    async (tx: any) => {
      await deleteRutasInTransaction(tx, [id]);
    },
    { maxWait: 15_000, timeout: 30_000 },
  );
  emitWebhookEventAsync("ruta.deleted", {
    id: ruta.id,
    choferId: ruta.choferId,
    fecha: ruta.fecha,
  });
};
