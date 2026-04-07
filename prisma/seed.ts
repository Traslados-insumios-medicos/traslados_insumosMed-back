import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

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
  console.log('✅ Admin:', admin.email, '/ contraseña: Admin1234!')

  // Chofer de prueba
  const choferPassword = await bcrypt.hash('Medlogix1234!', 10)
  const chofer = await prisma.usuario.upsert({
    where: { email: 'chofer@medlogix.ec' },
    update: {},
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
  console.log('✅ Chofer:', chofer.email, '/ contraseña: Medlogix1234!')

  // Cliente principal de prueba
  const clientePrincipal = await prisma.cliente.upsert({
    where: { ruc: '1791234560001' },
    update: {},
    create: {
      nombre: 'CIMED S.A.',
      ruc: '1791234560001',
      direccion: 'Av. Amazonas N39-123, Quito',
      telefonoContacto: '+593 2 123 4567',
      emailContacto: 'logistica@cimed.ec',
      tipo: 'PRINCIPAL',
      activo: true,
    },
  })
  console.log('✅ Cliente principal:', clientePrincipal.nombre)

  // Cliente secundario (punto de entrega)
  const clienteSecundario = await prisma.cliente.upsert({
    where: { ruc: '1791234560002' },
    update: {},
    create: {
      nombre: 'Metrored Hospital',
      ruc: '1791234560002',
      direccion: 'Av. 10 de Agosto N25-45, Quito',
      telefonoContacto: '+593 2 234 5678',
      emailContacto: 'bodega@metrored.ec',
      tipo: 'SECUNDARIO',
      clientePrincipalId: clientePrincipal.id,
      activo: true,
    },
  })
  console.log('✅ Cliente secundario:', clienteSecundario.nombre)

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
  console.log('✅ Usuario cliente:', clienteUser.email, '/ contraseña: Medlogix1234!')

  console.log('\n🎉 Seed completado!')
  console.log('─────────────────────────────')
  console.log('Admin    → admin@medlogix.ec    / Admin1234!')
  console.log('Chofer   → chofer@medlogix.ec   / Medlogix1234!')
  console.log('Cliente  → cliente@medlogix.ec  / Medlogix1234!')
  console.log('─────────────────────────────')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
