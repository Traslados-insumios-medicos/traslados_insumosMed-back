import { prisma } from '../../config/prisma'

export async function dashboard() {
  const [enviosActivos, rutasEnCurso, entregasCompletadas, novedadesCount, ultimasRutas, ultimasNovedades] =
    await Promise.all([
      prisma.guiaEntrega.count({ where: { ruta: { estado: { in: ['PENDIENTE', 'EN_CURSO'] } } } }),
      prisma.ruta.count({ where: { estado: 'EN_CURSO' } }),
      prisma.guiaEntrega.count({ where: { estado: 'ENTREGADO' } }),
      prisma.novedad.count(),
      prisma.ruta.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          chofer: { select: { id: true, nombre: true } },
          guias: { select: { id: true, estado: true } },
          stops: { select: { id: true, orden: true, direccion: true }, orderBy: { orden: 'asc' }, take: 1 },
        },
      }),
      prisma.novedad.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
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
                  chofer: { select: { nombre: true } }
                }
              },
              stop: {
                select: {
                  cliente: { select: { nombre: true } }
                }
              }
            } 
          } 
        },
      }),
    ])

  return {
    enviosActivos,
    rutasEnCurso,
    entregasCompletadas,
    novedadesCount,
    ultimasRutas: ultimasRutas.map((r) => {
      const total = r.guias.length
      const entregadas = r.guias.filter((g) => g.estado === 'ENTREGADO').length
      const incidencias = r.guias.filter((g) => g.estado === 'INCIDENCIA').length
      return {
        id: r.id,
        fecha: r.fecha,
        estado: r.estado,
        chofer: r.chofer,
        progreso: total ? Math.round(((entregadas + incidencias) / total) * 100) : 0,
        totalGuias: total,
        primerDestino: r.stops[0]?.direccion ?? '—',
      }
    }),
    ultimasNovedades,
  }
}

export async function reportePorCliente(filters?: { clienteId?: string; desde?: string; hasta?: string; tipo?: string }) {
  const clientes = await prisma.cliente.findMany({
    where: {
      ...(filters?.clienteId ? { id: filters.clienteId } : {}),
      ...(filters?.tipo ? { tipo: filters.tipo as 'PRINCIPAL' | 'SECUNDARIO' } : {})
    },
    include: {
      clientePrincipal: {
        select: { nombre: true }
      },
      guias: {
        select: { id: true, estado: true, receptorNombre: true, createdAt: true },
        where: {
          ...(filters?.desde || filters?.hasta ? {
            createdAt: {
              ...(filters.desde ? { gte: new Date(filters.desde) } : {}),
              ...(filters.hasta ? { lte: new Date(filters.hasta + 'T23:59:59') } : {}),
            }
          } : {})
        }
      },
    },
  })

  return clientes.map((c) => ({
    clienteId: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    clientePrincipal: c.clientePrincipal,
    total: c.guias.length,
    entregados: c.guias.filter((g) => g.estado === 'ENTREGADO').length,
    pendientes: c.guias.filter((g) => g.estado === 'PENDIENTE').length,
    incidencias: c.guias.filter((g) => g.estado === 'INCIDENCIA').length,
  }))
}

export async function reportePorChofer(filters?: { choferId?: string; desde?: string; hasta?: string }) {
  const choferes = await prisma.usuario.findMany({
    where: { rol: 'CHOFER', ...(filters?.choferId ? { id: filters.choferId } : {}) },
    include: {
      rutas: {
        where: {
          ...(filters?.desde || filters?.hasta ? {
            fecha: {
              ...(filters.desde ? { gte: filters.desde } : {}),
              ...(filters.hasta ? { lte: filters.hasta } : {}),
            }
          } : {})
        },
        include: {
          stops: { include: { cliente: true } },
          guias: {
            include: {
              novedades: true,
            },
          },
        },
      },
    },
  })

  return choferes.map((ch) => ({
    choferId: ch.id,
    nombre: ch.nombre,
    cedula: ch.cedula,
    rutas: ch.rutas.map((r) => ({
      rutaId: r.id,
      fecha: r.fecha,
      estado: r.estado,
      guias: r.guias.map((g) => {
        const stop = r.stops.find((s) => s.id === g.stopId)
        return {
          guiaId: g.id,
          numeroGuia: g.numeroGuia,
          descripcion: g.descripcion,
          estado: g.estado,
          cliente: stop?.cliente?.nombre ?? g.clienteId,
          receptorNombre: g.receptorNombre,
          horaLlegada: g.horaLlegada,
          horaSalida: g.horaSalida,
          temperatura: g.temperatura,
          observaciones: g.observaciones,
          novedades: g.novedades.map((n) => n.descripcion),
        }
      }),
    })),
  }))
}

export async function reportePorFecha(desde?: string, hasta?: string, clienteId?: string) {
  return prisma.guiaEntrega.findMany({
    where: {
      ...(clienteId ? { clienteId } : {}),
      createdAt: {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
      },
    },
    include: {
      cliente: { select: { nombre: true } },
      ruta: { include: { chofer: { select: { nombre: true } } } },
      novedades: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
