-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contributionsUsd" DECIMAL(14,2) NOT NULL,
    "sharePct" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberMovement" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "concept" TEXT NOT NULL,
    "inUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "MemberMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaMovement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "concept" TEXT NOT NULL,
    "inUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "CajaMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalUsd" DECIMAL(14,2) NOT NULL,
    "shares" JSONB NOT NULL,

    CONSTRAINT "Liquidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ok" BOOLEAN NOT NULL,
    "message" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");

-- CreateIndex
CREATE INDEX "MemberMovement_memberId_date_idx" ON "MemberMovement"("memberId", "date");

-- CreateIndex
CREATE INDEX "CajaMovement_date_idx" ON "CajaMovement"("date");

-- AddForeignKey
ALTER TABLE "MemberMovement" ADD CONSTRAINT "MemberMovement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
