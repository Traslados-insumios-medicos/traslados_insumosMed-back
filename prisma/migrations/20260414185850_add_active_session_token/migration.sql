/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[activeSessionToken]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "activeSessionToken" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ALTER COLUMN "mustChangePassword" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_resetToken_key" ON "Usuario"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_activeSessionToken_key" ON "Usuario"("activeSessionToken");
