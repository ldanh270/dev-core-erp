-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipientState" (
    "notificationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipientState_pkey" PRIMARY KEY ("notificationId","employeeId")
);

-- CreateIndex
CREATE INDEX "Notification_employeeId_createdAt_idx" ON "Notification"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_employeeId_type_createdAt_idx" ON "Notification"("employeeId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecipientState_employeeId_deleted_read_idx" ON "NotificationRecipientState"("employeeId", "deleted", "read");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipientState" ADD CONSTRAINT "NotificationRecipientState_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipientState" ADD CONSTRAINT "NotificationRecipientState_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
