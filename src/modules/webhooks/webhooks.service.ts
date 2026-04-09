import crypto from 'crypto'
import { env } from '../../config/env'

export type WebhookEventType =
  | 'cliente.created'
  | 'cliente.updated'
  | 'cliente.deleted'
  | 'cliente.activo_toggled'
  | 'guia.estado_updated'
  | 'guia.detalle_updated'
  | 'ruta.created'
  | 'ruta.estado_updated'
  | 'ruta.seguimiento_updated'
  | 'ruta.chofer_assigned'

interface WebhookEvent<T = unknown> {
  id: string
  type: WebhookEventType
  occurredAt: string
  payload: T
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function signBody(body: string): string {
  return crypto.createHmac('sha256', env.WEBHOOK_SECRET).update(body).digest('hex')
}

async function postWithRetry(url: string, body: string, signature: string): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= env.WEBHOOK_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), env.WEBHOOK_TIMEOUT_MS)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': signature,
        },
        body,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) return
      lastError = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastError = err
    }

    if (attempt < env.WEBHOOK_RETRIES) {
      await sleep(300 * attempt)
    }
  }
  throw lastError
}

export async function emitWebhookEvent<T = unknown>(type: WebhookEventType, payload: T): Promise<void> {
  if (!env.WEBHOOK_URLS.length || !env.WEBHOOK_SECRET) return

  const event: WebhookEvent<T> = {
    id: crypto.randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    payload,
  }

  const body = JSON.stringify(event)
  const signature = signBody(body)

  await Promise.allSettled(
    env.WEBHOOK_URLS.map(async (url) => {
      try {
        await postWithRetry(url, body, signature)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown webhook error'
        console.error(`[WEBHOOK] ${type} -> ${url} failed: ${msg}`)
      }
    }),
  )
}

export function emitWebhookEventAsync<T = unknown>(type: WebhookEventType, payload: T): void {
  void emitWebhookEvent(type, payload)
}
