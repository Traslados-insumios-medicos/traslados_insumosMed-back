/*
  Warnings:

  - The values [EN_TRAFICO] on the enum `EstadoSeguimientoChofer` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[celular]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoSeguimientoChofer_new" AS ENUM ('NINGUNO', 'EN_CAMINO', 'CERCA_DESTINO');
ALTER TABLE "Ruta" ALTER COLUMN "seguimientoChofer" DROP DEFAULT;
ALTER TABLE "Ruta" ALTER COLUMN "seguimientoChofer" TYPE "EstadoSeguimientoChofer_new" USING ("seguimientoChofer"::text::"EstadoSeguimientoChofer_new");
ALTER TYPE "EstadoSeguimientoChofer" RENAME TO "EstadoSeguimientoChofer_old";
ALTER TYPE "EstadoSeguimientoChofer_new" RENAME TO "EstadoSeguimientoChofer";
DROP TYPE "EstadoSeguimientoChofer_old";
ALTER TABLE "Ruta" ALTER COLUMN "seguimientoChofer" SET DEFAULT 'NINGUNO';
COMMIT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "telefono" TEXT;

-- CreateTable
CREATE TABLE "ruta_seguimiento_logs" (
    "id" TEXT NOT NULL,
    "ruta_id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "seguimiento_chofer" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ruta_seguimiento_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ruta_seguimiento_logs_ruta_id_created_at" ON "ruta_seguimiento_logs"("ruta_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_celular_key" ON "Usuario"("celular");
