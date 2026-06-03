-- Make numeroGuia optional (nullable)
-- PostgreSQL allows multiple NULLs in a unique index by default (NULL != NULL),
-- so the existing unique constraint still protects real guide numbers.

-- Step 1: Drop the existing unique index (will be recreated as partial)
DROP INDEX IF EXISTS "GuiaEntrega_numeroGuia_key";

-- Step 2: Make the column nullable
ALTER TABLE "GuiaEntrega" ALTER COLUMN "numeroGuia" DROP NOT NULL;

-- Step 3: Recreate unique index only for non-null values (partial unique index)
-- This allows multiple NULL rows while still enforcing uniqueness for real guide numbers.
CREATE UNIQUE INDEX "GuiaEntrega_numeroGuia_key" ON "GuiaEntrega"("numeroGuia") WHERE "numeroGuia" IS NOT NULL;
