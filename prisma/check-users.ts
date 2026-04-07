import { config } from 'dotenv'
config()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { email: true, rol: true, activo: true, nombre: true },
  })
  console.log('\n👥 Usuarios en Neon:')
  console.log(JSON.stringify(usuarios, null, 2))

  const rutas = await prisma.ruta.count()
  const guias = await prisma.guiaEntrega.count()
  console.log(`\n📊 Rutas: ${rutas} | Guías: ${guias}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
