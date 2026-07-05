import { Router, Request, Response } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { progressManager } from './progress.manager';

const router = Router();

/**
 * GET /api/progress/stream?jobId=<UUID>
 * Endpoint genérico de escucha SSE para cualquier tarea larga del sistema.
 * Protegido por autenticación JWT (Bearer token o cabecera).
 */
router.get('/stream', authenticate, (req: Request, res: Response) => {
  const { jobId } = req.query as { jobId?: string };
  if (!jobId) {
    res.status(400).json({ message: 'El parámetro jobId es requerido' });
    return;
  }

  // Sin timeout local para permitir streaming SSE de larga duración
  res.setTimeout(0);
  progressManager.register(jobId, res);
});

export default router;
