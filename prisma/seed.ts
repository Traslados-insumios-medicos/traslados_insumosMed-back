/**
 * Seed de desarrollo — MedLogix
 * Datos realistas para probar el módulo chofer en el frontend
 *
 * Ejecutar: npm run prisma:seed
 */
import { config } from 'dotenv'
config()

import { PrismaClient, Rol, EstadoRuta, EstadoGuia, TipoNovedad } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ['error'] })

// Helper para crear ruta + stops + guías
async function crearRuta(data: {
  fecha: string
  estado: EstadoRuta
  choferId: string
  stops: {
    orden: number
    direccion: string
    lat: number
    lng: number
    clienteId: string
    notas?: string
    guias: { numero: string; descripcion: string; estado: EstadoGuia }[]
  }[]
}) {
  const ruta = await prisma.ruta.create({
    data: {
      fecha: data.fecha,
      estado: data.estado,
      choferId: data.choferId,
      stops: {
        create: data.stops.map((s) => ({
          orden: s.orden,
          direccion: s.direccion,
          lat: s.lat,
          lng: s.lng,
          clienteId: s.clienteId,
          notas: s.notas,
        })),
      },
    },
    include: { stops: true },
  })

  // Crear guías por stop en orden
  for (let i = 0; i < data.stops.length; i++) {
    for (const g of data.stops[i].guias) {
      await prisma.guiaEntrega.create({
        data: {
          numeroGuia: g.numero,
          descripcion: g.descripcion,
          estado: g.estado,
          clienteId: data.stops[i].clienteId,
          rutaId: ruta.id,
          stopId: ruta.stops[i].id,
          // Si está entregada, agregar datos de entrega
          ...(g.estado === EstadoGuia.ENTREGADO && {
            receptorNombre: 'María González',
            horaLlegada: '09:15',
            horaSalida: '09:30',
            temperatura: '18°C',
            observaciones: 'Entregado sin novedad',
          }),
        },
      })
    }
  }

  return ruta
}

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpiar en orden por FK
  await prisma.seguimientoNovedad.deleteMany()
  await prisma.novedad.deleteMany()
  await prisma.foto.deleteMany()
  await prisma.guiaEntrega.deleteMany()
  await prisma.stop.deleteMany()
  await prisma.ruta.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.cliente.deleteMany()

  const hash = (p: string) => bcrypt.hash(p, 10)
  const hoy = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  const anteayer = new Date(hoy); anteayer.setDate(hoy.getDate() - 2)
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  // ── Clientes ──────────────────────────────────────────────────
  const hospitalCentral = await prisma.cliente.create({
    data: {
      nombre: 'Hospital Central',
      ruc: '20123456789',
      direccion: 'Av. Grau 755, Lima',
      telefonoContacto: '01-4441234',
      emailContacto: 'logistica@hospitalcentral.pe',
    },
  })

  const clinicaSanRafael = await prisma.cliente.create({
    data: {
      nombre: 'Clínica San Rafael',
      ruc: '20987654321',
      direccion: 'Av. Javier Prado Este 1066, San Isidro',
      telefonoContacto: '01-4459876',
      emailContacto: 'compras@clinicasanrafael.pe',
    },
  })

  const clinicaRicardo = await prisma.cliente.create({
    data: {
      nombre: 'Clínica Ricardo Palma',
      ruc: '20456789123',
      direccion: 'Av. Javier Prado Oeste 1066, Miraflores',
      telefonoContacto: '01-2242224',
      emailContacto: 'abastecimiento@ricardopalma.pe',
    },
  })

  const farmaciaBotica = await prisma.cliente.create({
    data: {
      nombre: 'Farmacia Boticas Perú',
      ruc: '20111222333',
      direccion: 'Jr. de la Unión 300, Cercado de Lima',
      telefonoContacto: '01-4271234',
      emailContacto: 'pedidos@boticasperu.pe',
    },
  })

  const centroSalud = await prisma.cliente.create({
    data: {
      nombre: 'Centro de Salud Villa María',
      ruc: '20333444555',
      direccion: 'Av. Pachacútec 1200, Villa María del Triunfo',
      telefonoContacto: '01-2981234',
      emailContacto: 'almacen@csvillamaria.gob.pe',
    },
  })

  // ── Usuarios ──────────────────────────────────────────────────
  await prisma.usuario.create({
    data: {
      nombre: 'Admin MedLogix',
      email: 'admin@medlogix.pe',
      password: await hash('admin123'),
      rol: Rol.ADMIN,
    },
  })

  const chofer1 = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Quispe',
      cedula: '12345678',
      email: 'chofer1@medlogix.pe',
      password: await hash('chofer123'),
      rol: Rol.CHOFER,
    },
  })

  const chofer2 = await prisma.usuario.create({
    data: {
      nombre: 'Luis Mamani',
      cedula: '87654321',
      email: 'chofer2@medlogix.pe',
      password: await hash('chofer123'),
      rol: Rol.CHOFER,
    },
  })

  await prisma.usuario.create({
    data: {
      nombre: 'Jefe Logística Hospital',
      email: 'cliente@hospitalcentral.pe',
      password: await hash('cliente123'),
      rol: Rol.CLIENTE,
      clienteId: hospitalCentral.id,
    },
  })

  // ════════════════════════════════════════════════════════════
  // RUTAS DE CARLOS QUISPE (chofer1)
  // ════════════════════════════════════════════════════════════

  // Ruta 1 — HOY, PENDIENTE (para probar "Iniciar ruta")
  await crearRuta({
    fecha: fmt(hoy),
    estado: EstadoRuta.PENDIENTE,
    choferId: chofer1.id,
    stops: [
      {
        orden: 1,
        direccion: 'Av. Grau 755, Lima',
        lat: -12.0566,
        lng: -77.0356,
        clienteId: hospitalCentral.id,
        notas: 'Entregar en farmacia central, piso 1. Preguntar por Sra. Rosa.',
        guias: [
          { numero: 'G-0001', descripcion: 'Jeringas 5ml x 1000u', estado: EstadoGuia.PENDIENTE },
          { numero: 'G-0002', descripcion: 'Suero fisiológico 1L x 50u', estado: EstadoGuia.PENDIENTE },
        ],
      },
      {
        orden: 2,
        direccion: 'Av. Javier Prado Este 1066, San Isidro',
        lat: -12.0931,
        lng: -77.0197,
        clienteId: clinicaSanRafael.id,
        notas: 'Ingreso por puerta lateral. Horario: 8am-12pm.',
        guias: [
          { numero: 'G-0003', descripcion: 'Guantes quirúrgicos talla M x 500u', estado: EstadoGuia.PENDIENTE },
          { numero: 'G-0004', descripcion: 'Mascarillas N95 x 200u', estado: EstadoGuia.PENDIENTE },
        ],
      },
      {
        orden: 3,
        direccion: 'Jr. de la Unión 300, Cercado de Lima',
        lat: -12.0464,
        lng: -77.0306,
        clienteId: farmaciaBotica.id,
        notas: 'Coordinar con almacén antes de llegar: 987-654-321',
        guias: [
          { numero: 'G-0005', descripcion: 'Alcohol 70% x 100 litros', estado: EstadoGuia.PENDIENTE },
        ],
      },
    ],
  })

  // Ruta 2 — HOY, EN_CURSO (para probar progreso parcial)
  const ruta2 = await crearRuta({
    fecha: fmt(hoy),
    estado: EstadoRuta.EN_CURSO,
    choferId: chofer1.id,
    stops: [
      {
        orden: 1,
        direccion: 'Av. Javier Prado Oeste 1066, Miraflores',
        lat: -12.1006,
        lng: -77.0353,
        clienteId: clinicaRicardo.id,
        notas: 'Recepción de insumos: 7am-2pm',
        guias: [
          { numero: 'G-0006', descripcion: 'Catéteres venosos x 200u', estado: EstadoGuia.ENTREGADO },
          { numero: 'G-0007', descripcion: 'Gasas estériles x 1000u', estado: EstadoGuia.ENTREGADO },
        ],
      },
      {
        orden: 2,
        direccion: 'Av. Pachacútec 1200, Villa María del Triunfo',
        lat: -12.1619,
        lng: -76.9428,
        clienteId: centroSalud.id,
        notas: 'Zona sur. Calcular 45 min desde Miraflores.',
        guias: [
          { numero: 'G-0008', descripcion: 'Termómetros digitales x 50u', estado: EstadoGuia.PENDIENTE },
          { numero: 'G-0009', descripcion: 'Oxímetros de pulso x 30u', estado: EstadoGuia.PENDIENTE },
        ],
      },
    ],
  })

  // Ruta 3 — AYER, COMPLETADA (para probar historial)
  await crearRuta({
    fecha: fmt(ayer),
    estado: EstadoRuta.COMPLETADA,
    choferId: chofer1.id,
    stops: [
      {
        orden: 1,
        direccion: 'Av. Grau 755, Lima',
        lat: -12.0566,
        lng: -77.0356,
        clienteId: hospitalCentral.id,
        notas: 'Entrega urgente de medicamentos',
        guias: [
          { numero: 'G-0010', descripcion: 'Insulina NPH x 100 viales', estado: EstadoGuia.ENTREGADO },
          { numero: 'G-0011', descripcion: 'Amoxicilina 500mg x 1000 caps', estado: EstadoGuia.ENTREGADO },
        ],
      },
      {
        orden: 2,
        direccion: 'Jr. de la Unión 300, Cercado de Lima',
        lat: -12.0464,
        lng: -77.0306,
        clienteId: farmaciaBotica.id,
        notas: '',
        guias: [
          { numero: 'G-0012', descripcion: 'Paracetamol 500mg x 5000 tabs', estado: EstadoGuia.ENTREGADO },
        ],
      },
    ],
  })

  // Ruta 4 — ANTEAYER, COMPLETADA con incidencia
  const ruta4 = await crearRuta({
    fecha: fmt(anteayer),
    estado: EstadoRuta.COMPLETADA,
    choferId: chofer1.id,
    stops: [
      {
        orden: 1,
        direccion: 'Av. Javier Prado Este 1066, San Isidro',
        lat: -12.0931,
        lng: -77.0197,
        clienteId: clinicaSanRafael.id,
        notas: '',
        guias: [
          { numero: 'G-0013', descripcion: 'Bisturís desechables x 200u', estado: EstadoGuia.ENTREGADO },
          { numero: 'G-0014', descripcion: 'Vendas elásticas x 100u', estado: EstadoGuia.INCIDENCIA },
        ],
      },
    ],
  })

  // Ruta 5 — MAÑANA, PENDIENTE (ruta futura)
  await crearRuta({
    fecha: fmt(manana),
    estado: EstadoRuta.PENDIENTE,
    choferId: chofer1.id,
    stops: [
      {
        orden: 1,
        direccion: 'Av. Pachacútec 1200, Villa María del Triunfo',
        lat: -12.1619,
        lng: -76.9428,
        clienteId: centroSalud.id,
        notas: 'Entrega programada para mañana temprano',
        guias: [
          { numero: 'G-0015', descripcion: 'Vacunas hepatitis B x 200 dosis', estado: EstadoGuia.PENDIENTE },
          { numero: 'G-0016', descripcion: 'Jeringas 1ml x 500u', estado: EstadoGuia.PENDIENTE },
        ],
      },
      {
        orden: 2,
        direccion: 'Av. Javier Prado Oeste 1066, Miraflores',
        lat: -12.1006,
        lng: -77.0353,
        clienteId: clinicaRicardo.id,
        notas: '',
        guias: [
          { numero: 'G-0017', descripcion: 'Solución dextrosa 5% x 100u', estado: EstadoGuia.PENDIENTE },
        ],
      },
    ],
  })

  // ════════════════════════════════════════════════════════════
  // RUTAS DE LUIS MAMANI (chofer2)
  // ════════════════════════════════════════════════════════════

  await crearRuta({
    fecha: fmt(hoy),
    estado: EstadoRuta.EN_CURSO,
    choferId: chofer2.id,
    stops: [
      {
        orden: 1,
        direccion: 'Av. Grau 755, Lima',
        lat: -12.0566,
        lng: -77.0356,
        clienteId: hospitalCentral.id,
        notas: 'Urgente — medicamentos oncológicos',
        guias: [
          { numero: 'G-0018', descripcion: 'Metotrexato 50mg x 10 viales', estado: EstadoGuia.ENTREGADO },
        ],
      },
      {
        orden: 2,
        direccion: 'Av. Javier Prado Este 1066, San Isidro',
        lat: -12.0931,
        lng: -77.0197,
        clienteId: clinicaSanRafael.id,
        notas: '',
        guias: [
          { numero: 'G-0019', descripcion: 'Equipos de venoclisis x 100u', estado: EstadoGuia.PENDIENTE },
        ],
      },
    ],
  })

  // ── Novedades en ruta4 (guía G-0014 con incidencia) ──────────
  const guiaConIncidencia = await prisma.guiaEntrega.findFirst({
    where: { numeroGuia: 'G-0014' },
  })

  if (guiaConIncidencia) {
    const novedad = await prisma.novedad.create({
      data: {
        tipo: TipoNovedad.MERCADERIA_DANADA,
        descripcion: 'Caja de vendas llegó húmeda y con signos de deterioro. Se rechazó la entrega.',
        guiaId: guiaConIncidencia.id,
      },
    })

    await prisma.seguimientoNovedad.create({
      data: {
        novedadId: novedad.id,
        nota: 'Se contactó al proveedor. Reposición programada para el lunes.',
      },
    })
  }

  // ── Resumen ───────────────────────────────────────────────────
  const totalRutas = await prisma.ruta.count()
  const totalGuias = await prisma.guiaEntrega.count()

  console.log('✅ Seed completado')
  console.log('')
  console.log('  Credenciales de acceso:')
  console.log('  ┌──────────────────────────────────────────────────┐')
  console.log('  │ ADMIN   → admin@medlogix.pe        / admin123    │')
  console.log('  │ CHOFER  → chofer1@medlogix.pe      / chofer123   │')
  console.log('  │ CHOFER  → chofer2@medlogix.pe      / chofer123   │')
  console.log('  │ CLIENTE → cliente@hospitalcentral.pe / cliente123 │')
  console.log('  └──────────────────────────────────────────────────┘')
  console.log('')
  console.log(`  📦 ${totalRutas} rutas creadas | ${totalGuias} guías`)
  console.log('')
  console.log('  Rutas de Carlos Quispe (chofer1):')
  console.log('  → Hoy PENDIENTE  (3 stops, 5 guías) — para probar "Iniciar ruta"')
  console.log('  → Hoy EN_CURSO   (2 stops, 4 guías, 2 entregadas) — progreso parcial')
  console.log('  → Ayer COMPLETADA (2 stops, 3 guías) — historial')
  console.log('  → Anteayer COMPLETADA con incidencia (1 stop, 2 guías)')
  console.log('  → Mañana PENDIENTE (2 stops, 3 guías) — ruta futura')
  console.log('')
  console.log('  Rutas de Luis Mamani (chofer2):')
  console.log('  → Hoy EN_CURSO (2 stops, 2 guías, 1 entregada)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
