import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { JwtPayload } from '../middlewares/auth.middleware'

export function initWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  })

  // Auth middleware — verifica JWT en handshake
  io.use((socket, next) => {
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

    // Unirse a la sala de una ruta
    socket.on('join:ruta', (rutaId: string) => {
      socket.join(`ruta:${rutaId}`)
    })

    // Chofer emite su posición GPS
    socket.on('posicion_chofer', (data: { rutaId: string; lat: number; lng: number }) => {
      if (user.rol !== 'CHOFER') return
      io.to(`ruta:${data.rutaId}`).emit('posicion_chofer', {
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
      })
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
      // cleanup automático por socket.io
    })
  })

  return io
}
