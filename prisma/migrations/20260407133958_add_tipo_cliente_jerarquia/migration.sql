-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('PRINCIPAL', 'SECUNDARIO');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "clientePrincipalId" TEXT,
ADD COLUMN     "tipo" "TipoCliente" NOT NULL DEFAULT 'SECUNDARIO';

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_clientePrincipalId_fkey" FOREIGN KEY ("clientePrincipalId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
