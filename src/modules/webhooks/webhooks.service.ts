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
  | 'ruta.deleted'

interface WebhookEvent<T = unknown> {
  id: string
  type: WebhookEventType
  occurredAt: string
  payload: T
}

interface DeliveryLog {
  at: string
  eventId: string
  type: WebhookEventType
  url: string
  ok: boolean
  status?: number
  error?: string
}

const MAX_DELIVERY_LOGS = 200
const deliveryLogs: DeliveryLog[] = []
const queue: Array<WebhookEvent<unknown>> = []
let processing = false
let totalEnqueued = 0
let totalProcessed = 0
let totalFailed = 0

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

  await Promise.allSettled(env.WEBHOOK_URLS.map(async (url) => {
    let ok = false
    let status: number | undefined
    let error: string | undefined
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
      status = res.status
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      ok = true
    } catch (err) {
      try {
        await postWithRetry(url, body, signature)
        ok = true
      } catch (retryErr) {
        const e = retryErr instanceof Error ? retryErr : err
        error = e instanceof Error ? e.message : 'unknown webhook error'
        console.error(`[WEBHOOK] ${type} -> ${url} failed: ${error}`)
      }
    } finally {
      deliveryLogs.unshift({
        at: new Date().toISOString(),
        eventId: event.id,
        type,
        url,
        ok,
        status,
        error,
      })
      if (deliveryLogs.length > MAX_DELIVERY_LOGS) deliveryLogs.length = MAX_DELIVERY_LOGS
      if (!ok) totalFailed += 1
    }
  }))
}

async function processQueue(): Promise<void> {
  if (processing) return
  processing = true
  try {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) continue
      await emitWebhookEvent(item.type, item.payload)
      totalProcessed += 1
    }
  } finally {
    processing = false
  }
}

export function emitWebhookEventAsync<T = unknown>(type: WebhookEventType, payload: T): void {
  if (!env.WEBHOOK_URLS.length || !env.WEBHOOK_SECRET) return
  queue.push({
    id: crypto.randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    payload,
  })
  totalEnqueued += 1
  void processQueue()
}

export function getWebhookHealth() {
  return {
    configured: env.WEBHOOK_URLS.length > 0 && !!env.WEBHOOK_SECRET,
    urls: env.WEBHOOK_URLS,
    timeoutMs: env.WEBHOOK_TIMEOUT_MS,
    retries: env.WEBHOOK_RETRIES,
    queueSize: queue.length,
    processing,
    totals: {
      enqueued: totalEnqueued,
      processed: totalProcessed,
      failed: totalFailed,
    },
    recentDeliveries: deliveryLogs.slice(0, 20),
  }
}
