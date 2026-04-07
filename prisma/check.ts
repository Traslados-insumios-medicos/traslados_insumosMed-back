import { config } from 'dotenv'
config()
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

async function main() {
  const [rutas, guias, usuarios, stops, clientes] = await Promise.all([
    prisma.ruta.count(),
    prisma.guiaEntrega.count(),
    prisma.usuario.count(),
    prisma.stop.count(),
    prisma.cliente.count(),
  ])
  console.log('\n📊 Conteo en BD:', { rutas, guias, usuarios, stops, clientes })

  const rutasList = await prisma.ruta.findMany({
    select: { id: true, fecha: true, estado: true, choferId: true },
    orderBy: { fecha: 'desc' },
  })
  console.log('\n🗺️  Rutas:\n', JSON.stringify(rutasList, null, 2))

  const chofer = await prisma.usuario.findFirst({ where: { rol: 'CHOFER' }, select: { id: true, nombre: true, email: true } })
  console.log('\n👤 Primer chofer:', chofer)

  if (chofer) {
    const rutasChofer = await prisma.ruta.count({ where: { choferId: chofer.id } })
    console.log(`\n🔗 Rutas asignadas a ${chofer.nombre}: ${rutasChofer}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
