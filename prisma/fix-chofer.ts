import { config } from 'dotenv'
config()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Activar el chofer
  await prisma.usuario.update({
    where: { email: 'chofer@medlogix.ec' },
    data: { activo: true },
  })
  console.log('✅ chofer@medlogix.ec activado')

  // Verificar
  const u = await prisma.usuario.findUnique({
    where: { email: 'chofer@medlogix.ec' },
    select: { nombre: true, activo: true, rol: true },
  })
  console.log('Estado:', u)
}

main().catch(console.error).finally(() => prisma.$disconnect())
