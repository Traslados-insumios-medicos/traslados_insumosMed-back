import { prisma } from '../../config/prisma'

export async function reportePorCliente() {
  const clientes = await prisma.cliente.findMany({
    include: {
      guias: {
        select: { id: true, estado: true, receptorNombre: true },
      },
    },
  })

  return clientes.map((c) => ({
    clienteId: c.id,
    nombre: c.nombre,
    total: c.guias.length,
    entregados: c.guias.filter((g) => g.estado === 'ENTREGADO').length,
    pendientes: c.guias.filter((g) => g.estado === 'PENDIENTE').length,
    incidencias: c.guias.filter((g) => g.estado === 'INCIDENCIA').length,
  }))
}

export async function reportePorChofer(choferId?: string) {
  const choferes = await prisma.usuario.findMany({
    where: { rol: 'CHOFER', ...(choferId ? { id: choferId } : {}) },
    include: {
      rutas: {
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
