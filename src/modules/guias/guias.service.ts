import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { UpdateEstadoGuiaDto, UpdateDetalleGuiaDto } from "./guias.schema";
import { emitWebhookEventAsync } from "../webhooks/webhooks.service";
import { getIo } from "../../websocket";

const rutaMini = {
  select: {
    id: true,
    fecha: true,
    estado: true,
    hojaRuta: true,
    seguimientoChofer: true,
    choferId: true,
    chofer: { select: { id: true, nombre: true } },
  },
} as const;

const guiaIncludeDetail = {
  cliente: { select: { id: true, nombre: true } },
  stop: true,
  fotos: true,
  novedades: { include: { seguimientos: true } },
  ruta: rutaMini,
};

const guiaListInclude = {
  cliente: { select: { id: true, nombre: true } },
  stop: {
    select: { id: true, orden: true, direccion: true, lat: true, lng: true },
  },
  ruta: rutaMini,
};

/** IDs de clientes cuyas guías puede ver el usuario del panel (principal + secundarios). */
export async function resolveAlcanceClienteIds(
  clienteUsuarioId: string,
): Promise<string[]> {
  const c = await prisma.cliente.findUnique({
    where: { id: clienteUsuarioId },
  });
  if (!c) return [clienteUsuarioId];
  if (c.tipo === "PRINCIPAL") {
    const sec = await prisma.cliente.findMany({
      where: { clientePrincipalId: c.id },
      select: { id: true },
    });
    return [c.id, ...sec.map((s) => s.id)];
  }
  return [c.id];
}

export const getById = (id: string) =>
  prisma.guiaEntrega.findUniqueOrThrow({
    where: { id },
    include: guiaIncludeDetail,
  });

export type VistaMisEnvios =
  | "activos"
  | "historial"
  | "todos"
  | "incidencias"
  | "entregadosHoy";

export interface MisEnviosQuery {
  clienteUsuarioId: string;
  search?: string;
  page?: number;
  limit?: number;
  vista?: VistaMisEnvios;
  filtroGuia?: "con-guia" | "sin-guia";
}

function buildWhereMisEnvios(
  alcance: string[],
  search: string | undefined,
  vista: VistaMisEnvios,
  filtroGuia?: "con-guia" | "sin-guia",
): Prisma.GuiaEntregaWhereInput {
  const where: Prisma.GuiaEntregaWhereInput = { clienteId: { in: alcance } };
  const parts: Prisma.GuiaEntregaWhereInput[] = [];

  if (search?.trim()) {
    const q = search.trim();
    parts.push({
      OR: [
        { numeroGuia: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
        { ruta: { hojaRuta: { contains: q, mode: "insensitive" } } },
        { ruta: { nombre: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (vista === "activos") {
    parts.push({
      AND: [{ estado: "PENDIENTE" }, { ruta: { estado: "EN_CURSO" } }],
    });
  } else if (vista === "historial") {
    parts.push({
      OR: [{ estado: "ENTREGADO" }, { estado: "INCIDENCIA" }],
    });
  } else if (vista === "incidencias") {
    parts.push({ estado: "INCIDENCIA" });
  } else if (vista === "entregadosHoy") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    parts.push({
      estado: "ENTREGADO",
      updatedAt: { gte: startOfToday },
    });
  }

  if (filtroGuia === "con-guia") {
    // Prisma 5: usar NOT a nivel de condición para "campo IS NOT NULL"
    parts.push({ NOT: { numeroGuia: null } });
  } else if (filtroGuia === "sin-guia") {
    parts.push({ numeroGuia: null });
  }

  if (parts.length) where.AND = parts;
  return where;
}

export async function getMisEnviosList(q: MisEnviosQuery) {
  const {
    clienteUsuarioId,
    search,
    page = 1,
    limit = 10,
    vista = "todos",
    filtroGuia,
  } = q;
  const alcance = await resolveAlcanceClienteIds(clienteUsuarioId);
  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;
  const where = buildWhereMisEnvios(alcance, search, vista, filtroGuia);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const baseAlcance = {
    clienteId: { in: alcance },
  } satisfies Prisma.GuiaEntregaWhereInput;

  const [data, total, activas, entregadosHoy, incidencias, clienteRow] =
    await Promise.all([
      prisma.guiaEntrega.findMany({
        where,
        include: guiaListInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.guiaEntrega.count({ where }),
      prisma.guiaEntrega.count({
        where: {
          ...baseAlcance,
          OR: [
            { estado: { in: ["PENDIENTE", "INCIDENCIA"] } },
            { ruta: { estado: "EN_CURSO" } },
          ],
        },
      }),
      prisma.guiaEntrega.count({
        where: {
          ...baseAlcance,
          estado: "ENTREGADO",
          updatedAt: { gte: startOfDay },
        },
      }),
      prisma.guiaEntrega.count({
        where: { ...baseAlcance, estado: "INCIDENCIA" },
      }),
      prisma.cliente.findUnique({
        where: { id: clienteUsuarioId },
        select: { nombre: true },
      }),
    ]);

  return {
    data,
    total,
    page: Math.max(1, page),
    limit: take,
    resumen: {
      activas,
      entregadosHoy,
      incidencias,
      nombreEmpresa: clienteRow?.nombre ?? "Cliente",
    },
  };
}

export const updateEstado = async (id: string, dto: UpdateEstadoGuiaDto) => {
  const guia = await prisma.guiaEntrega.update({
    where: { id },
    data: { estado: dto.estado },
  });
  emitWebhookEventAsync("guia.estado_updated", {
    id: guia.id,
    numeroGuia: guia.numeroGuia,
    estado: guia.estado,
    rutaId: guia.rutaId,
    clienteId: guia.clienteId,
    stopId: guia.stopId,
  });

  // Emitir evento de socket cuando hay incidencia
  if (dto.estado === "INCIDENCIA" && guia.rutaId) {
    try {
      getIo().to(`ruta:${guia.rutaId}`).emit("guia:incidencia", {
        guiaId: guia.id,
        numeroGuia: guia.numeroGuia,
        rutaId: guia.rutaId,
      });
    } catch {
      // Socket no disponible
    }
  }

  // Emitir evento cuando se entrega
  if (dto.estado === "ENTREGADO" && guia.rutaId) {
    try {
      getIo().to(`ruta:${guia.rutaId}`).emit("guia:entregada", {
        guiaId: guia.id,
        numeroGuia: guia.numeroGuia,
        rutaId: guia.rutaId,
      });
    } catch {
      // Socket no disponible
    }
  }

  return guia;
};

export const updateDetalle = async (id: string, dto: UpdateDetalleGuiaDto) => {
  const { tipoIncidencia, ...detalleData } = dto;

  const guia = await prisma.guiaEntrega.update({
    where: { id },
    data: detalleData,
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
  });

  // Crear novedad si es incidencia y viene el tipo explícito
  if (guia.estado === "INCIDENCIA" && tipoIncidencia) {
    const novedadExistente = await prisma.novedad.findFirst({
      where: { guiaId: guia.id },
    });

    if (!novedadExistente) {
      const descripcionNovedad =
        guia.observaciones ||
        (tipoIncidencia === "CLIENTE_AUSENTE"
          ? "Cliente no estuvo presente en el momento de la entrega"
          : tipoIncidencia === "MERCADERIA_DANADA"
            ? "La mercadería presenta daños"
            : tipoIncidencia === "DIRECCION_INCORRECTA"
              ? "La dirección proporcionada es incorrecta"
              : "Otra incidencia reportada por el chofer");

      await prisma.novedad.create({
        data: {
          tipo: tipoIncidencia,
          descripcion: descripcionNovedad,
          guiaId: guia.id,
        },
      });


    }
  }

  // Compatibilidad hacia atrás: detectar prefijo legacy "INCIDENCIA:" en receptorNombre
  if (
    guia.estado === "INCIDENCIA" &&
    !tipoIncidencia &&
    guia.receptorNombre?.startsWith("INCIDENCIA:")
  ) {
    const tipoLegacy = guia.receptorNombre.replace("INCIDENCIA:", "").trim() as
      | "CLIENTE_AUSENTE"
      | "MERCADERIA_DANADA"
      | "DIRECCION_INCORRECTA"
      | "OTRO";

    const novedadExistente = await prisma.novedad.findFirst({
      where: { guiaId: guia.id },
    });
    if (!novedadExistente) {
      const descripcionNovedad =
        guia.observaciones || "Incidencia reportada por el chofer";
      await prisma.novedad.create({
        data: {
          tipo: tipoLegacy,
          descripcion: descripcionNovedad,
          guiaId: guia.id,
        },
      });
    }
  }

  emitWebhookEventAsync("guia.detalle_updated", guia);
  return guia;
};
