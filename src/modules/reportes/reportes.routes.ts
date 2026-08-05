import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import * as ctrl from "./reportes.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", ctrl.getDashboard);
router.get("/clientes", ctrl.porCliente);
router.get("/choferes", ctrl.porChofer);
router.get("/fechas", ctrl.porFecha);
router.get("/guias", ctrl.porGuia);

// ─── Generación de Reporte General en PDF (Streaming) ─────────────────────────
router.get("/pdf/general", ctrl.exportPdfGeneral);

// ─── Exportación y Liberación de Imágenes (Test & Producción) ─────────────────
router.get('/rutas-con-imagenes', ctrl.getRutasConImagenesFiltradas);
router.post("/pdf/export-images", ctrl.exportPdfImages);
router.post("/liberar-imagenes", ctrl.liberarImagenes);

export default router;
