import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'

// WebSocket — descomentar cuando se implemente Mapbox tracking
// import { createServer } from 'http'
// import { initWebSocket } from './websocket'
// const httpServer = createServer(app)
// initWebSocket(httpServer)

async function main() {
  await prisma.$connect()
  console.log('✅ Base de datos conectada')

  app.listen(env.PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.PORT}`)
    console.log(`📦 Entorno: ${env.NODE_ENV}`)
  })

  // Con WebSocket:
  // httpServer.listen(env.PORT, () => { ... })
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err)
  process.exit(1)
})
