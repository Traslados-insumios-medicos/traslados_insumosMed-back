import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const usuarios = await prisma.usuario.findMany({ select: { email: true, rol: true } });
    console.log('--- RESULTADOS DE LA BASE DE DATOS ACTUAL ---');
    console.log(`URL de Conexión: ${process.env.DATABASE_URL?.substring(0, 45)}...`);
    console.log(`Total de usuarios encontrados: ${usuarios.length}`);
    usuarios.forEach(u => console.log(`- ${u.email} (${u.rol})`));
    console.log('---------------------------------------------');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
