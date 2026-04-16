import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      celular: true,
      rol: true,
    }
  })
  
  console.log('📋 Usuarios en la base de datos:')
  console.table(usuarios)
  
  const chofer = await prisma.usuario.findUnique({
    where: { celular: '0987654321' }
  })
  
  console.log('\n📱 Búsqueda por celular 0987654321:')
  console.log(chofer ? '✅ Encontrado' : '❌ No encontrado')
  if (chofer) {
    console.log('Nombre:', chofer.nombre)
    console.log('Email:', chofer.email)
    console.log('Celular:', chofer.celular)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
