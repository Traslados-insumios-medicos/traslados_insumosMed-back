import { prisma } from "../../config/prisma";
import { CreateNovedadDto, CreateSeguimientoDto } from "./novedades.schema";

const novedadInclude = {
  guia: {
    select: {
      id: true,
      numeroGuia: true,
      clienteId: true,
      descripcion: true,
      observaciones: true,
      estado: true,
      receptorNombre: true,
      ruta: {
        select: {
          id: true,
          fecha: true,
          hojaRuta: true,
          chofer: { select: { nombre: true } },
        },
      },
      stop: {
        select: {
          cliente: { select: { nombre: true } },
        },
      },
    },
  },
  seguimientos: { orderBy: { createdAt: "asc" as const } },
};

export interface GetAllNovedadesQuery {
  page?: number;
  limit?: number;
  search?: string;
  clienteId?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
}

export const getAll = async (q: GetAllNovedadesQuery = {}) => {
  const { page = 1, limit = 15, search, clienteId, tipo, desde, hasta } = q;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (clienteId) where.guia = { ...where.guia, clienteId };
  if (tipo) where.tipo = tipo;
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta + "T23:59:59");
  }
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { descripcion: { contains: q, mode: "insensitive" } },
      { tipo: { contains: q, mode: "insensitive" } },
      { guia: { numeroGuia: { contains: q, mode: "insensitive" } } },
      { guia: { receptorNombre: { contains: q, mode: "insensitive" } } },
      {
        guia: {
          ruta: { chofer: { nombre: { contains: q, mode: "insensitive" } } },
        },
      },
      {
        guia: {
          stop: { cliente: { nombre: { contains: q, mode: "insensitive" } } },
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.novedad.findMany({
      where,
      include: novedadInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.novedad.count({ where }),
  ]);

  return { data, total, page, limit };
};

export const getById = (id: string) =>
  prisma.novedad.findUniqueOrThrow({ where: { id }, include: novedadInclude });

export const getByGuia = (guiaId: string) =>
  prisma.novedad.findMany({ where: { guiaId }, include: novedadInclude });

export const create = async (dto: CreateNovedadDto) => {
  const novedad = await prisma.novedad.create({
    data: dto,
    include: novedadInclude,
  });

  // Actualizar estado de la guía a INCIDENCIA automáticamente
  await prisma.guiaEntrega.update({
    where: { id: dto.guiaId },
    data: { estado: "INCIDENCIA" },
  });

  return novedad;
};

export const addSeguimiento = (novedadId: string, dto: CreateSeguimientoDto) =>
  prisma.seguimientoNovedad.create({ data: { novedadId, nota: dto.nota } });
