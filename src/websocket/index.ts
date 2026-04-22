import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { JwtPayload } from '../middlewares/auth.middleware'

let ioRef: Server | null = null

/** Para emitir eventos desde servicios HTTP después del arranque. */
export function getIo(): Server {
  if (!ioRef) throw new Error('Socket.IO no inicializado')
  return ioRef
}

/** Emite un evento de refresco a todos los admins conectados. */
export function emitRefresh(entity: 'clientes' | 'choferes' | 'rutas' | 'usuarios', sourceSocketId?: string) {
  try {
    getIo().to('admins').emit('db:refresh', { entity, sourceSocketId })
  } catch {
    // WS no inicializado aún
  }
}

/** Emite un evento de desactivación de cuenta al usuario específico. */
export function emitAccountDeactivated(userId: string) {
  try {
    const io = getIo()
    let emittedCount = 0
    // Buscar todos los sockets del usuario y emitir el evento
    io.sockets.sockets.forEach((socket) => {
      const user = socket.data.user as JwtPayload | undefined
      if (user && user.userId === userId) {
        console.log(`🔴 Emitiendo account:deactivated al socket ${socket.id} del usuario ${userId}`)
        socket.emit('account:deactivated')
        emittedCount++
      }
    })
    console.log(`✅ Evento account:deactivated emitido a ${emittedCount} socket(s) del usuario ${userId}`)
  } catch (error) {
    console.error('❌ Error al emitir account:deactivated:', error)
  }
}

export function initWebSocket(httpServer: HttpServer) {
  const wsOrigin = env.NODE_ENV === 'development' ? true : env.FRONTEND_URLS
  const io = new Server(httpServer, {
    cors: { origin: wsOrigin, credentials: true },
  })
  ioRef = io

  // Auth middleware — verifica JWT en handshake
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Token requerido'))
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload
    console.log(`✅ Usuario conectado: ${user.userId} (${user.rol}) - Socket: ${socket.id}`)

    // Unirse a la sala de una ruta
    socket.on('join:ruta', (rutaId: string) => {
      socket.join(`ruta:${rutaId}`)
      console.log(`🚪 Usuario ${user.userId} (${user.rol}) se unió a sala ruta:${rutaId}`)
    })

    // Chofer emite su posición GPS
    socket.on('posicion_chofer', (data: { rutaId: string; lat: number; lng: number }) => {
      if (user.rol !== 'CHOFER') return
      console.log(`📍 Chofer ${user.userId} envía posición para ruta:${data.rutaId}`, { lat: data.lat, lng: data.lng })
      io.to(`ruta:${data.rutaId}`).emit('posicion_chofer', {
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
      })
      console.log(`📡 Posición emitida a sala ruta:${data.rutaId}`)
    })

    // Chofer cambia estado de una guía
    socket.on('estado_guia', (data: { rutaId: string; guiaId: string; estado: string }) => {
      io.to(`ruta:${data.rutaId}`).emit('estado_guia', data)
    })

    // Chofer reporta novedad — broadcast a admins también
    socket.on('nueva_novedad', (data: { rutaId: string; guiaId: string; tipo: string; descripcion: string }) => {
      io.to(`ruta:${data.rutaId}`).emit('nueva_novedad', data)
      // Notificar a sala global de admins
      io.to('admins').emit('nueva_novedad', data)
    })

    // Admin se une a sala global de notificaciones
    if (user.rol === 'ADMIN') {
      socket.join('admins')
    }

    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${user.userId} (${user.rol}) - Socket: ${socket.id}`)
    })
  })

  return io
}
