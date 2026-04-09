import dotenv from 'dotenv'
dotenv.config()

const frontendUrls = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

const webhookUrls = (process.env.WEBHOOK_URLS ?? '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

export const env = {
  PORT: process.env.PORT ?? '3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  FRONTEND_URL: frontendUrls[0] ?? 'http://localhost:5173',
  FRONTEND_URLS: frontendUrls.length ? frontendUrls : ['http://localhost:5173'],

  // Cloudinary — configurar antes de conectar al frontend
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',

  // Mapbox (para tracking en tiempo real)
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN ?? '',

  // Webhooks salientes (integraciones externas)
  WEBHOOK_URLS: webhookUrls,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ?? '',
  WEBHOOK_TIMEOUT_MS: Number(process.env.WEBHOOK_TIMEOUT_MS ?? 5000),
  WEBHOOK_RETRIES: Number(process.env.WEBHOOK_RETRIES ?? 3),
}
