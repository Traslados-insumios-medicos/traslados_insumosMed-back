import { createServer } from 'http'
import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import { initWebSocket } from './websocket'

const httpServer = createServer(app)
initWebSocket(httpServer)

async function main() {
  await prisma.$connect()
  console.log('[OK] Base de datos conectada')

  httpServer.listen(env.PORT, () => {
    console.log(`[OK] Servidor corriendo en http://localhost:${env.PORT}`)
    console.log(`[INFO] Entorno: ${env.NODE_ENV}`)
    console.log(`[OK] WebSocket activo`)
  })
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err)
  process.exit(1)
})
