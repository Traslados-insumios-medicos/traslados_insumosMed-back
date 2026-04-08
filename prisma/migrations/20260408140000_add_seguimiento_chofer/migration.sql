-- CreateEnum
CREATE TYPE "EstadoSeguimientoChofer" AS ENUM ('NINGUNO', 'EN_CAMINO', 'EN_TRAFICO', 'CERCA_DESTINO');

-- AlterTable
ALTER TABLE "Ruta" ADD COLUMN "seguimientoChofer" "EstadoSeguimientoChofer" NOT NULL DEFAULT 'NINGUNO';
