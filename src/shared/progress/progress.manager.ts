import { Response } from 'express';
import { env } from '../../config/env';
import { ProgressEvent } from './progress.types';

interface ActiveClient {
  res: Response;
  timeout: NodeJS.Timeout;
}

class ProgressManager {
  private clients = new Map<string, ActiveClient>();

  public register(
    jobId: string,
    res: Response,
    timeoutMs = env.SSE_PROGRESS_TIMEOUT_MS,
  ): void {
    this.remove(jobId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const timeout = setTimeout(() => {
      this.error(
        jobId,
        'Tiempo de espera agotado para la tarea en segundo plano (timeout).',
      );
    }, timeoutMs);

    this.clients.set(jobId, { res, timeout });

    res.on('close', () => this.remove(jobId));
    res.on('finish', () => this.remove(jobId));
  }

  public emit(jobId: string, event: ProgressEvent): void {
    const client = this.clients.get(jobId);
    if (!client) return;

    client.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  public complete(
    jobId: string,
    message = 'Proceso completado con éxito.',
  ): void {
    const client = this.clients.get(jobId);
    if (!client) return;

    this.emit(jobId, {
      step: 'completed',
      message,
      percent: 100,
    });

    client.res.end();
    this.remove(jobId);
  }

  public error(jobId: string, message: string): void {
    const client = this.clients.get(jobId);
    if (!client) return;

    this.emit(jobId, {
      step: 'error',
      message,
    });

    client.res.end();
    this.remove(jobId);
  }

  public remove(jobId: string): void {
    const client = this.clients.get(jobId);
    if (client) {
      clearTimeout(client.timeout);
      this.clients.delete(jobId);
    }
  }
}

export const progressManager = new ProgressManager();
