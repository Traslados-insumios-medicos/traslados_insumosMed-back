import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('[INFO] Seeding...')

  // Admin
  const adminPassword = await bcrypt.hash('Admin1234!', 10)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@medlogix.ec' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@medlogix.ec',
      password: adminPassword,
      rol: 'ADMIN',
      mustChangePassword: false,
      activo: true,
    },
  })
  console.log('[OK] Admin:', admin.email, '/ contraseña: Admin1234!')

  // Chofer de prueba
  const choferPassword = await bcrypt.hash('Medlogix1234!', 10)
  const chofer = await prisma.usuario.upsert({
    where: { email: 'chofer@medlogix.ec' },
    update: { password: choferPassword, activo: true, mustChangePassword: false },
    create: {
      nombre: 'Carlos Pérez',
      email: 'chofer@medlogix.ec',
      password: choferPassword,
      rol: 'CHOFER',
      cedula: '1712345678',
      mustChangePassword: false,
      activo: true,
    },
  })
  console.log('[OK] Chofer:', chofer.email, '/ contraseña: Medlogix1234!')

  // Cliente principal de prueba
  const clientePrincipal = await prisma.cliente.upsert({
    where: { ruc: '1791234560001' },
    update: ({ lat: -0.1807, lng: -78.4678 } as unknown as Prisma.ClienteUncheckedUpdateInput),
    create: {
      nombre: 'CIMED S.A.',
      ruc: '1791234560001',
      direccion: 'Av. Amazonas N39-123, Quito',
      lat: -0.1807,
      lng: -78.4678,
      telefonoContacto: '+593 2 123 4567',
      emailContacto: 'logistica@cimed.ec',
      tipo: 'PRINCIPAL',
      activo: true,
    } as unknown as Prisma.ClienteUncheckedCreateInput,
  })
  console.log('[OK] Cliente principal:', clientePrincipal.nombre)

  // Cliente secundario (punto de entrega)
  const clienteSecundario = await prisma.cliente.upsert({
    where: { ruc: '1791234560002' },
    update: ({ lat: -0.2105, lng: -78.4896 } as unknown as Prisma.ClienteUncheckedUpdateInput),
    create: {
      nombre: 'Metrored Hospital',
      ruc: '1791234560002',
      direccion: 'Av. 10 de Agosto N25-45, Quito',
      lat: -0.2105,
      lng: -78.4896,
      telefonoContacto: '+593 2 234 5678',
      emailContacto: 'bodega@metrored.ec',
      tipo: 'SECUNDARIO',
      clientePrincipalId: clientePrincipal.id,
      activo: true,
    } as unknown as Prisma.ClienteUncheckedCreateInput,
  })
  console.log('[OK] Cliente secundario:', clienteSecundario.nombre)

  // Usuario cliente (acceso al panel del cliente principal)
  const clienteUserPassword = await bcrypt.hash('Medlogix1234!', 10)
  const clienteUser = await prisma.usuario.upsert({
    where: { email: 'cliente@medlogix.ec' },
    update: {},
    create: {
      nombre: 'Admin CIMED',
      email: 'cliente@medlogix.ec',
      password: clienteUserPassword,
      rol: 'CLIENTE',
      clienteId: clientePrincipal.id,
      mustChangePassword: false,
      activo: true,
    },
  })
  console.log('[OK] Usuario cliente:', clienteUser.email, '/ contraseña: Medlogix1234!')

  // Limpiar rutas y dependencias previas para evitar duplicados en sucesivos seeds
  await prisma.novedad.deleteMany({})
  await prisma.foto.deleteMany({})
  await prisma.guiaEntrega.deleteMany({})
  await prisma.stop.deleteMany({})
  await prisma.ruta.deleteMany({})
  await prisma.cliente.deleteMany({ where: { ruc: { in: ['1791234560003', '1791234560004'] } } })

  // Nuevos Clientes Reales en Quito
  const clinicaPichincha = await prisma.cliente.create({
    data: ({
      nombre: 'Clínica Pichincha',
      ruc: '1791234560003',
      direccion: 'Calle Veintimilla E4-66 y Paez, Quito',
      lat: -0.2013,
      lng: -78.4947,
      telefonoContacto: '+593 2 256 2296',
      tipo: 'SECUNDARIO',
      activo: true,
    } as unknown as Prisma.ClienteUncheckedCreateInput)
  })

  const hMetropolitano = await prisma.cliente.create({
    data: ({
      nombre: 'Hospital Metropolitano',
      ruc: '1791234560004',
      direccion: 'Av. Mariana de Jesús y Nicolás Arteta, Quito',
      lat: -0.1878,
      lng: -78.4984,
      telefonoContacto: '+593 2 399 8000',
      tipo: 'SECUNDARIO',
      activo: true,
    } as unknown as Prisma.ClienteUncheckedCreateInput)
  })

  // Ruta de demo: EN_CURSO, progreso parcial (2/4 guías entregadas) — útil para panel chofer/cliente sin “completada”
  const fechaHoy = new Date().toISOString().split('T')[0]
  const rutaRealista = await prisma.ruta.create({
    data: {
      fecha: fechaHoy,
      choferId: chofer.id,
      estado: 'EN_CURSO',
      seguimientoChofer: 'EN_CAMINO',
    } as unknown as Prisma.RutaUncheckedCreateInput,
  })

  const stop1 = await prisma.stop.create({
    data: { orden: 1, direccion: clienteSecundario.direccion, lat: -0.180653, lng: -78.467834, clienteId: clienteSecundario.id, rutaId: rutaRealista.id, notas: 'Acceso por puerta posterior (bodega)' }
  })
  await prisma.guiaEntrega.create({ data: { numeroGuia: 'G-10001', descripcion: 'Insumos Quirúrgicos - Cajas x5', estado: 'ENTREGADO', clienteId: clienteSecundario.id, rutaId: rutaRealista.id, stopId: stop1.id } })

  const stop2 = await prisma.stop.create({
    data: { orden: 2, direccion: clinicaPichincha.direccion, lat: -0.2013, lng: -78.4947, clienteId: clinicaPichincha.id, rutaId: rutaRealista.id, notas: 'Entrega urgente en Recepción Médica' }
  })
  await prisma.guiaEntrega.create({ data: { numeroGuia: 'G-10002', descripcion: 'Material Desechable - Guantes y Mascarillas', estado: 'ENTREGADO', clienteId: clinicaPichincha.id, rutaId: rutaRealista.id, stopId: stop2.id } })

  const stop3 = await prisma.stop.create({
    data: { orden: 3, direccion: hMetropolitano.direccion, lat: -0.1878, lng: -78.4984, clienteId: hMetropolitano.id, rutaId: rutaRealista.id, notas: 'Hablar con el encargado general logístico' }
  })
  await prisma.guiaEntrega.createMany({
    data: [
      { numeroGuia: 'G-10003', descripcion: 'Equipos de monitoreo vital', estado: 'PENDIENTE', clienteId: hMetropolitano.id, rutaId: rutaRealista.id, stopId: stop3.id },
      { numeroGuia: 'G-10004', descripcion: 'Medicamentos Especializados x10', estado: 'PENDIENTE', clienteId: hMetropolitano.id, rutaId: rutaRealista.id, stopId: stop3.id }
    ]
  })

  console.log('[OK] Ruta demo en curso (50% guías) para', chofer.nombre, '- Ruta:', rutaRealista.id)

  console.log('\n[OK] Seed completado. Ruta Carlos: EN_CURSO · 2/4 guías entregadas · seguimiento EN_CAMINO.')
  console.log('─────────────────────────────')
  console.log('Admin    → admin@medlogix.ec    / Admin1234!')
  console.log('Chofer   → chofer@medlogix.ec   / Medlogix1234!')
  console.log('Cliente  → cliente@medlogix.ec  / Medlogix1234!')
  console.log('─────────────────────────────')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
