-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "invoice_month" TEXT NOT NULL,
    "total_amount_eur" REAL NOT NULL,
    "vat_amount_eur" REAL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sent_at" DATETIME,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeedUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "quantity_used_grams" REAL NOT NULL,
    "trays_seeded" INTEGER NOT NULL,
    "seeded_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeedUsageLog_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StandingOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "StandingOrder_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StandingOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standing_order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "size_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_time_eur" REAL NOT NULL,
    "delivery_day_of_week" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "StandingOrderItem_standing_order_id_fkey" FOREIGN KEY ("standing_order_id") REFERENCES "StandingOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StandingOrderItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "visit_date" DATETIME NOT NULL,
    "outcome" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SalesVisit_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "message_text" TEXT NOT NULL,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Invoice_customer_id_idx" ON "Invoice"("customer_id");

-- CreateIndex
CREATE INDEX "Invoice_invoice_month_idx" ON "Invoice"("invoice_month");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_customer_id_invoice_month_key" ON "Invoice"("customer_id", "invoice_month");

-- CreateIndex
CREATE INDEX "SeedUsageLog_crop_id_idx" ON "SeedUsageLog"("crop_id");

-- CreateIndex
CREATE INDEX "SeedUsageLog_seeded_date_idx" ON "SeedUsageLog"("seeded_date");

-- CreateIndex
CREATE INDEX "StandingOrder_customer_id_idx" ON "StandingOrder"("customer_id");

-- CreateIndex
CREATE INDEX "StandingOrder_status_idx" ON "StandingOrder"("status");

-- CreateIndex
CREATE INDEX "StandingOrderItem_standing_order_id_idx" ON "StandingOrderItem"("standing_order_id");

-- CreateIndex
CREATE INDEX "StandingOrderItem_variant_id_idx" ON "StandingOrderItem"("variant_id");

-- CreateIndex
CREATE INDEX "SalesVisit_customer_id_idx" ON "SalesVisit"("customer_id");

-- CreateIndex
CREATE INDEX "SalesVisit_visit_date_idx" ON "SalesVisit"("visit_date");

-- CreateIndex
CREATE INDEX "Message_from_user_id_idx" ON "Message"("from_user_id");

-- CreateIndex
CREATE INDEX "Message_to_user_id_idx" ON "Message"("to_user_id");

-- CreateIndex
CREATE INDEX "Message_order_id_idx" ON "Message"("order_id");
