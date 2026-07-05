import { Request, Response, NextFunction } from "express";
import * as svc from "./reportes.service";
import { generateReporteGeneralPdf } from "./pdf/pdf-general.service";
import { progressManager } from "../../shared/progress/progress.manager";

export const getDashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await svc.dashboard());
  } catch (e) {
    next(e);
  }
};

export const porCliente = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const clienteId = req.query.clienteId as string | undefined;
    const desde = req.query.desde as string | undefined;
    const hasta = req.query.hasta as string | undefined;
    const tipo = req.query.tipo as string | undefined;
    const choferId = req.query.choferId as string | undefined;
    const ciudad = req.query.ciudad as string | undefined;
    res.json(
      await svc.reportePorCliente({
        clienteId,
        desde,
        hasta,
        tipo,
        choferId,
        ciudad,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const porChofer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const choferId = req.query.choferId as string | undefined;
    const desde = req.query.desde as string | undefined;
    const hasta = req.query.hasta as string | undefined;
    res.json(await svc.reportePorChofer({ choferId, desde, hasta }));
  } catch (e) {
    next(e);
  }
};

export const porFecha = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { desde, hasta, clienteId, choferId, ciudad, filtroGuia } =
      req.query as Record<string, string>;
    const fg =
      filtroGuia === "con-guia" || filtroGuia === "sin-guia"
        ? (filtroGuia as "con-guia" | "sin-guia")
        : undefined;
    res.json(
      await svc.reportePorFecha(desde, hasta, clienteId, choferId, ciudad, fg),
    );
  } catch (e) {
    next(e);
  }
};

export const porGuia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { desde, hasta, clienteId, choferId, tipo, ciudad, filtroGuia } =
      req.query as Record<string, string>;
    const fg =
      filtroGuia === "con-guia" || filtroGuia === "sin-guia"
        ? (filtroGuia as "con-guia" | "sin-guia")
        : undefined;
    res.json(
      await svc.reportePorGuia({
        desde,
        hasta,
        clienteId,
        choferId,
        tipo,
        ciudad,
        filtroGuia: fg,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const exportPdfGeneral = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.setTimeout(0);

    const { desde, hasta, clienteId, choferId, tipo, ciudad, filtroGuia, jobId, titulo } =
      req.query as Record<string, string>;

    const fg =
      filtroGuia === 'con-guia' || filtroGuia === 'sin-guia'
        ? (filtroGuia as 'con-guia' | 'sin-guia')
        : undefined;

    const filename = titulo
      ? `${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'reporte'}.pdf`
      : 'reporte-general.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await generateReporteGeneralPdf(res, {
      desde,
      hasta,
      clienteId,
      choferId,
      tipo,
      ciudad,
      filtroGuia: fg,
      jobId,
      titulo,
    });
  } catch (e) {
    if (req.query.jobId) {
      progressManager.error(
        String(req.query.jobId),
        e instanceof Error ? e.message : 'Error al generar el PDF',
      );
    }
    if (res.headersSent) {
      console.error('[PDF] Error durante streaming:', e);
      res.destroy();
    } else {
      next(e);
    }
  }
};

