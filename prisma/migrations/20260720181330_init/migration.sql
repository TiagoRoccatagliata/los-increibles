-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('DEPARTAMENTO', 'CASA', 'LOCAL', 'TERRENO', 'OTRO');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('COMPRADA', 'EN_OBRA', 'EN_VENTA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "TxCategory" AS ENUM ('COMPRA', 'ESCRITURA', 'COMISION', 'REFACCION', 'IMPUESTOS', 'SERVICIOS', 'EXPENSAS', 'VENTA', 'OTRO');

-- CreateEnum
CREATE TYPE "TxDirection" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'ARS');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "description" TEXT,
    "type" "PropertyType" NOT NULL DEFAULT 'DEPARTAMENTO',
    "status" "PropertyStatus" NOT NULL DEFAULT 'COMPRADA',
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchasePriceUsd" DECIMAL(14,2) NOT NULL,
    "listingPriceUsd" DECIMAL(14,2),
    "saleDate" TIMESTAMP(3),
    "salePriceUsd" DECIMAL(14,2),
    "surfaceM2" DECIMAL(10,2),
    "rooms" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "TxCategory" NOT NULL,
    "direction" "TxDirection" NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "amountUsd" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valuation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "valueUsd" DECIMAL(14,2) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_propertyId_date_idx" ON "Transaction"("propertyId", "date");

-- CreateIndex
CREATE INDEX "Valuation_propertyId_date_idx" ON "Valuation"("propertyId", "date");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
