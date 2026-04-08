import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Manejar desconexiones
prisma.$on('error', (e) => {
  console.error('Prisma error:', e)
})

prisma.$on('warn', (e) => {
  console.warn('Prisma warning:', e)
})
