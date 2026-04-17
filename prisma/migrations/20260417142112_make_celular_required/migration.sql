/*
  Warnings:

  - Made the column `celular` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/

-- Update NULL celular values with unique values before making it required
-- Generate unique celular values based on user ID
UPDATE "Usuario" 
SET "celular" = '099' || LPAD(SUBSTRING(id FROM 1 FOR 7), 7, '0')
WHERE "celular" IS NULL;

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "celular" SET NOT NULL;
