import { Request, Response } from 'express'
import { getWebhookHealth } from './webhooks.service'

export const health = (_req: Request, res: Response) => {
  res.json(getWebhookHealth())
}
