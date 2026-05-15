import { Request, Response, NextFunction } from "express";
import {
  createNovedadSchema,
  createSeguimientoSchema,
} from "./novedades.schema";
import * as svc from "./novedades.service";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 15);
    const search = req.query.search as string | undefined;
    const clienteId = req.query.clienteId as string | undefined;
    const tipo = req.query.tipo as string | undefined;
    const desde = req.query.desde as string | undefined;
    const hasta = req.query.hasta as string | undefined;
    res.json(
      await svc.getAll({ page, limit, search, clienteId, tipo, desde, hasta }),
    );
  } catch (e) {
    next(e);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await svc.getById(req.params.id as string));
  } catch (e) {
    next(e);
  }
};

export const getByGuia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await svc.getByGuia(req.params.guiaId as string));
  } catch (e) {
    next(e);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = createNovedadSchema.parse(req.body);
    res.status(201).json(await svc.create(dto));
  } catch (e) {
    next(e);
  }
};

export const addSeguimiento = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = createSeguimientoSchema.parse(req.body);
    res
      .status(201)
      .json(await svc.addSeguimiento(req.params.id as string, dto));
  } catch (e) {
    next(e);
  }
};
