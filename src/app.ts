import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { errorHandler } from './middlewares/error.middleware'

// Rutas de módulos
import authRoutes from './modules/auth/auth.routes'
import clientesRoutes from './modules/clientes/clientes.routes'
import usuariosRoutes from './modules/usuarios/usuarios.routes'
import rutasRoutes from './modules/rutas/rutas.routes'
import guiasRoutes from './modules/guias/guias.routes'
import fotosRoutes from './modules/fotos/fotos.routes'
import novedadesRoutes from './modules/novedades/novedades.routes'
import reportesRoutes from './modules/reportes/reportes.routes'

const app = express()

// Middlewares globales
app.use(cors({ 
  origin: env.NODE_ENV === 'development' ? true : env.FRONTEND_URL, 
  credentials: true 
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }))

// Módulos
app.use('/api/auth', authRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/rutas', rutasRoutes)
app.use('/api/guias', guiasRoutes)
app.use('/api/fotos', fotosRoutes)
app.use('/api/novedades', novedadesRoutes)
app.use('/api/reportes', reportesRoutes)

// Error handler global (siempre al final)
app.use(errorHandler)

export default app
