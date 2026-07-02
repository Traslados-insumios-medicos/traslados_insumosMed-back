import { prisma } from "../../config/prisma";
import { normalizeCiudad } from "../../utils/normalize-ciudad";

export async function dashboard() {
  const [
    enviosActivos,
    rutasEnCurso,
    entregasCompletadas,
    novedadesCount,
    ultimasRutas,
    ultimasNovedades,
  ] = await Promise.all([
    prisma.guiaEntrega.count({
      where: { ruta: { estado: { in: ["PENDIENTE", "EN_CURSO"] } } },
    }),
    prisma.ruta.count({ where: { estado: "EN_CURSO" } }),
    prisma.guiaEntrega.count({ where: { estado: "ENTREGADO" } }),
    prisma.novedad.count(),
    prisma.ruta.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        chofer: { select: { id: true, nombre: true } },
        guias: { select: { id: true, estado: true } },
        stops: {
          select: { id: true, orden: true, direccion: true },
          orderBy: { orden: "asc" },
          take: 1,
        },
      },
    }),
    prisma.novedad.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        guia: {
          select: {
            numeroGuia: true,
            clienteId: true,
            receptorNombre: true,
            ruta: {
              select: {
                id: true,
                fecha: true,
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
      },
    }),
  ]);

  return {
    enviosActivos,
    rutasEnCurso,
    entregasCompletadas,
    novedadesCount,
    ultimasRutas: ultimasRutas.map((r) => {
      const total = r.guias.length;
      const entregadas = r.guias.filter((g) => g.estado === "ENTREGADO").length;
      const incidencias = r.guias.filter(
        (g) => g.estado === "INCIDENCIA",
      ).length;
      return {
        id: r.id,
        fecha: r.fecha,
        estado: r.estado,
        chofer: r.chofer,
        progreso: total
          ? Math.round(((entregadas + incidencias) / total) * 100)
          : 0,
        totalGuias: total,
        primerDestino: r.stops[0]?.direccion ?? "—",
      };
    }),
    ultimasNovedades,
  };
}

export async function reportePorCliente(filters?: {
  clienteId?: string;
  desde?: string;
  hasta?: string;
  tipo?: string;
  choferId?: string;
  ciudad?: string;
}) {
  const ciudadNorm = normalizeCiudad(filters?.ciudad);

  const filtroFecha = {
    ...(filters?.desde ? { gte: filters.desde } : {}),
    ...(filters?.hasta ? { lte: filters.hasta } : {}),
  };

  const clientes = await prisma.cliente.findMany({
    where: {
      ...(filters?.clienteId ? { id: filters.clienteId } : {}),
      ...(filters?.tipo
        ? { tipo: filters.tipo as "PRINCIPAL" | "SECUNDARIO" }
        : {}),
      ...(ciudadNorm
        ? { ciudad: { equals: ciudadNorm, mode: "insensitive" } }
        : {}),
    },
    include: {
      clientePrincipal: {
        select: { nombre: true },
      },
      guias: {
        select: {
          id: true,
          numeroGuia: true,
          descripcion: true,
          estado: true,
          receptorNombre: true,
          horaLlegada: true,
          horaSalida: true,
          temperatura: true,
          observaciones: true,
          createdAt: true,
          ruta: {
            select: {
              id: true,
              nombre: true,
              hojaRuta: true,
              lugarOrigen: true,
              lugarDestino: true,
              fecha: true,
              createdAt: true,
              estado: true,
              chofer: { select: { id: true, nombre: true } },
            },
          },
          stop: { select: { id: true, direccion: true, lat: true, lng: true } },
          novedades: {
            select: { tipo: true, descripcion: true, createdAt: true },
          },
          fotos: {
            select: { id: true, urlPreview: true, tipo: true, createdAt: true },
          },
        },
        // CORRECCI N B1: choferId y fecha se fusionan en un unico objeto
        // "ruta" para evitar que dos spreads con la misma clave se sobreescriban
        // en el WHERE de Prisma. El criterio de fecha es Ruta.fecha
        // (fecha de planificacion operativa real) en lugar de GuiaEntrega.createdAt.
        where: {
          ...(filters?.choferId || Object.keys(filtroFecha).length > 0
            ? {
                ruta: {
                  ...(filters?.choferId ? { choferId: filters.choferId } : {}),
                  ...(Object.keys(filtroFecha).length > 0 ? { fecha: filtroFecha } : {}),
                },
              }
            : {}),
        },
      },
    },
  });

  return clientes.map((c) => ({
    clienteId: c.id,
    nombre: c.nombre,
    ciudad: c.ciudad,
    tipo: c.tipo,
    clientePrincipal: c.clientePrincipal,
    total: c.guias.length,
    entregados: c.guias.filter((g) => g.estado === "ENTREGADO").length,
    pendientes: c.guias.filter((g) => g.estado === "PENDIENTE").length,
    incidencias: c.guias.filter((g) => g.estado === "INCIDENCIA").length,
    guias: c.guias.map((g) => ({
      id: g.id,
      numeroGuia: g.numeroGuia,
      descripcion: g.descripcion,
      estado: g.estado,
      receptorNombre: g.receptorNombre,
      horaLlegada: g.horaLlegada,
      horaSalida: g.horaSalida,
      temperatura: g.temperatura,
      observaciones: g.observaciones,
      createdAt: g.createdAt,
      ruta: g.ruta,
      stop: g.stop,
      novedades: g.novedades.map((n) => ({
        tipo: n.tipo,
        descripcion: n.descripcion,
        createdAt: n.createdAt,
      })),
      fotos: g.fotos.map((f) => ({
        id: f.id,
        urlPreview: f.urlPreview,
        tipo: f.tipo,
        createdAt: f.createdAt,
      })),
    })),
  }));
}

export async function reportePorChofer(filters?: {
  choferId?: string;
  desde?: string;
  hasta?: string;
}) {
  const choferes = await prisma.usuario.findMany({
    where: {
      rol: "CHOFER",
      ...(filters?.choferId ? { id: filters.choferId } : {}),
    },
    include: {
      rutas: {
        // reportePorChofer ya usaba Ruta.fecha como criterio - sin cambio.
        where: {
          ...(filters?.desde || filters?.hasta
            ? {
                fecha: {
                  ...(filters.desde ? { gte: filters.desde } : {}),
                  ...(filters.hasta ? { lte: filters.hasta } : {}),
                },
              }
            : {}),
        },
        include: {
          // CORRECCI N B4: Incluir ciudad en el select del cliente de cada
          // stop para que la columna "Ciudad / Sector" este disponible en el
          // reporte y exportaciones de chofer.
          stops: {
            include: {
              cliente: { select: { id: true, nombre: true, ciudad: true } },
            },
          },
          guias: {
            include: {
              novedades: {
                select: { tipo: true, descripcion: true, createdAt: true },
              },
              fotos: {
                select: {
                  id: true,
                  urlPreview: true,
                  tipo: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return choferes.map((ch) => ({
    choferId: ch.id,
    nombre: ch.nombre,
    cedula: ch.cedula,
    rutas: ch.rutas.map((r) => ({
      rutaId: r.id,
      fecha: r.fecha,
      estado: r.estado,
      nombre: r.nombre,
      hojaRuta: r.hojaRuta,
      lugarOrigen: r.lugarOrigen,
      lugarDestino: r.lugarDestino,
      guias: r.guias.map((g) => {
        const stop = r.stops.find((s) => s.id === g.stopId);
        return {
          guiaId: g.id,
          stopId: g.stopId,
          numeroGuia: g.numeroGuia,
          descripcion: g.descripcion,
          estado: g.estado,
          cliente: stop?.cliente?.nombre ?? g.clienteId,
          // CORRECCI N B4: ciudad del cliente expuesta por guia en reporte chofer
          ciudadCliente: stop?.cliente?.ciudad ?? null,
          receptorNombre: g.receptorNombre,
          horaLlegada: g.horaLlegada,
          horaSalida: g.horaSalida,
          temperatura: g.temperatura,
          observaciones: g.observaciones,
          createdAt: g.createdAt,
          novedades: g.novedades.map((n) => ({
            tipo: n.tipo,
            descripcion: n.descripcion,
            createdAt: n.createdAt,
          })),
          fotos: g.fotos
            .filter((f) => f.tipo === "GUIA")
            .map((f) => ({
              id: f.id,
              urlPreview: f.urlPreview,
              tipo: f.tipo,
              createdAt: f.createdAt,
            })),
        };
      }),
    })),
  }));
}

export async function reportePorFecha(
  desde?: string,
  hasta?: string,
  clienteId?: string,
  choferId?: string,
  ciudad?: string,
  filtroGuia?: "con-guia" | "sin-guia",
) {
  const ciudadNorm = normalizeCiudad(ciudad);
  const filtroNumeroGuia =
    filtroGuia === "con-guia"
      ? { NOT: { numeroGuia: null } }
      : filtroGuia === "sin-guia"
        ? { numeroGuia: null }
        : {};

  // CORRECCI N B2: El criterio de fecha cambia de GuiaEntrega.createdAt a
  // Ruta.fecha (string "YYYY-MM-DD"), que representa la fecha de planificacion
  // real de la ruta. Los filtros choferId y fecha se unifican en un unico
  // objeto "ruta" para evitar colision de claves en Prisma.
  const filtroFecha = {
    ...(desde ? { gte: desde } : {}),
    ...(hasta ? { lte: hasta } : {}),
  };

  const filtroRutaFecha =
    choferId || Object.keys(filtroFecha).length > 0
      ? {
          ruta: {
            ...(choferId ? { choferId } : {}),
            ...(Object.keys(filtroFecha).length > 0 ? { fecha: filtroFecha } : {}),
          },
        }
      : {};

  return prisma.guiaEntrega.findMany({
    where: {
      ...(clienteId ? { clienteId } : {}),
      ...filtroRutaFecha,
      ...filtroNumeroGuia,
      ...(ciudadNorm
        ? { cliente: { ciudad: { equals: ciudadNorm, mode: "insensitive" } } }
        : {}),
    },
    include: {
      cliente: { select: { id: true, nombre: true, ciudad: true } },
      ruta: {
        select: {
          id: true,
          nombre: true,
          hojaRuta: true,
          lugarOrigen: true,
          lugarDestino: true,
          fecha: true,
          estado: true,
          chofer: { select: { id: true, nombre: true } },
        },
      },
      stop: { select: { id: true, direccion: true, lat: true, lng: true } },
      novedades: { select: { tipo: true, descripcion: true, createdAt: true } },
      fotos: {
        select: { id: true, urlPreview: true, tipo: true, createdAt: true },
      },
    },
    // Ordenar por fecha de ruta (criterio de negocio) descendente.
    // CORRECCI N B2: Se elimina take:500.
    orderBy: { ruta: { fecha: "desc" } },
  });
}

export async function reportePorGuia(filters?: {
  desde?: string;
  hasta?: string;
  clienteId?: string;
  choferId?: string;
  tipo?: string;
  ciudad?: string;
  filtroGuia?: "con-guia" | "sin-guia";
}) {
  const ciudadNorm = normalizeCiudad(filters?.ciudad);

  const filtroNumeroGuia =
    filters?.filtroGuia === "con-guia"
      ? { NOT: { numeroGuia: null } }
      : filters?.filtroGuia === "sin-guia"
        ? { numeroGuia: null }
        : {};

  // CORRECCI N B3: El criterio de fecha cambia de GuiaEntrega.createdAt a
  // Ruta.fecha. Los filtros choferId y fecha se unifican en un unico objeto
  // "ruta" para evitar que spreads separados con la misma clave se sobreescriban.
  const filtroFecha = {
    ...(filters?.desde ? { gte: filters.desde } : {}),
    ...(filters?.hasta ? { lte: filters.hasta } : {}),
  };

  const filtroRutaGuia =
    filters?.choferId || Object.keys(filtroFecha).length > 0
      ? {
          ruta: {
            ...(filters?.choferId ? { choferId: filters.choferId } : {}),
            ...(Object.keys(filtroFecha).length > 0 ? { fecha: filtroFecha } : {}),
          },
        }
      : {};

  return prisma.guiaEntrega.findMany({
    where: {
      ...(filters?.clienteId ? { clienteId: filters.clienteId } : {}),
      ...filtroRutaGuia,
      ...(filters?.tipo
        ? { cliente: { tipo: filters.tipo as "PRINCIPAL" | "SECUNDARIO" } }
        : {}),
      ...(ciudadNorm
        ? { cliente: { ciudad: { equals: ciudadNorm, mode: "insensitive" } } }
        : {}),
      ...filtroNumeroGuia,
    },
    include: {
      cliente: { select: { id: true, nombre: true, ciudad: true } },
      ruta: {
        select: {
          id: true,
          nombre: true,
          hojaRuta: true,
          lugarOrigen: true,
          lugarDestino: true,
          fecha: true,
          estado: true,
          chofer: { select: { id: true, nombre: true } },
        },
      },
      stop: { select: { id: true, direccion: true, lat: true, lng: true } },
      novedades: { select: { tipo: true, descripcion: true, createdAt: true } },
      fotos: {
        select: { id: true, urlPreview: true, tipo: true, createdAt: true },
      },
    },
    // Ordenar por fecha de ruta (criterio de negocio) descendente.
    // CORRECCI N B3: Se elimina take:500.
    orderBy: { ruta: { fecha: "desc" } },
  });
}
