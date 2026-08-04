-- CreateTable
CREATE TABLE "matching"."JobInvite" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobInvite_serviceRequestId_artisanId_key" ON "matching"."JobInvite"("serviceRequestId", "artisanId");

-- AddForeignKey
ALTER TABLE "matching"."JobInvite" ADD CONSTRAINT "JobInvite_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "matching"."ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
