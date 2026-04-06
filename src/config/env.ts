import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: process.env.PORT ?? '3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  // Cloudinary — configurar antes de conectar al frontend
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',

  // Mapbox (para tracking en tiempo real)
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN ?? '',
}
