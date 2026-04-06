/**
 * WebSocket — Tracking en tiempo real (Mapbox)
 *
 * Este módulo está reservado para implementar el tracking en tiempo real
 * de los choferes usando WebSocket + Mapbox GL JS.
 *
 * Flujo previsto:
 * 1. El chofer emite su posición GPS cada N segundos desde el frontend
 * 2. El servidor recibe la posición y la rebroadcastea a los clientes suscritos a esa ruta
 * 3. El cliente (empresa) ve el camión moverse en el mapa en tiempo real
 *
 * Implementación sugerida: socket.io o ws nativo
 *
 * Ejemplo de eventos:
 *   chofer:position  → { rutaId, lat, lng, timestamp }
 *   ruta:update      → { rutaId, lat, lng, timestamp }  (broadcast a clientes)
 *   ruta:estado      → { rutaId, estado }
 *
 * Para activar: instalar socket.io y descomentar la implementación
 */

// import { Server } from 'socket.io'
// import { Server as HttpServer } from 'http'
//
// export function initWebSocket(httpServer: HttpServer) {
//   const io = new Server(httpServer, {
//     cors: { origin: process.env.FRONTEND_URL }
//   })
//
//   io.on('connection', (socket) => {
//     console.log('Cliente conectado:', socket.id)
//
//     socket.on('chofer:position', (data: { rutaId: string; lat: number; lng: number }) => {
//       io.to(`ruta:${data.rutaId}`).emit('ruta:update', { ...data, timestamp: Date.now() })
//     })
//
//     socket.on('join:ruta', (rutaId: string) => {
//       socket.join(`ruta:${rutaId}`)
//     })
//
//     socket.on('disconnect', () => {
//       console.log('Cliente desconectado:', socket.id)
//     })
//   })
//
//   return io
// }

export {}
