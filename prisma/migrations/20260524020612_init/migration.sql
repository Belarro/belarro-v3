-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_en" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "photo_url" TEXT,
    "seeds_per_tray" REAL NOT NULL,
    "yield_per_tray" REAL NOT NULL,
    "total_growth_days" INTEGER NOT NULL,
    "seeding_schedule" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "size_name" TEXT NOT NULL,
    "size_grams" REAL NOT NULL,
    "price_eur" REAL NOT NULL,
    "container_qty" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeedInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "quantity_grams" REAL NOT NULL DEFAULT 0,
    "reorder_threshold_trays" INTEGER NOT NULL DEFAULT 20,
    "last_purchase_date" DATETIME,
    "last_purchase_qty_grams" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SeedInventory_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackageInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variant_id" TEXT NOT NULL,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "reorder_threshold" INTEGER NOT NULL DEFAULT 20,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PackageInventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SampleInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "available_grams" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SampleInventory_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "net_days" INTEGER NOT NULL DEFAULT 30,
    "first_contact_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "visit_date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Visit_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "follow_up_number" INTEGER NOT NULL,
    "follow_up_days" INTEGER NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_via" TEXT,
    "sent_date" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "FollowUp_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "product_variant_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "order_date" DATETIME NOT NULL,
    "next_delivery_date" DATETIME,
    "expected_harvest_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending_seed',
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeedingBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "seeding_date" DATETIME NOT NULL,
    "quantity_trays" INTEGER NOT NULL,
    "batch_type" TEXT NOT NULL,
    "expected_harvest_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SeedingBatch_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HarvestRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seeding_batch_id" TEXT NOT NULL,
    "harvest_date" DATETIME NOT NULL,
    "actual_yield_grams" REAL NOT NULL,
    "yield_used_for_orders_grams" REAL NOT NULL DEFAULT 0,
    "yield_available_samples_grams" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "HarvestRecord_seeding_batch_id_fkey" FOREIGN KEY ("seeding_batch_id") REFERENCES "SeedingBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderFulfillment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "harvest_record_id" TEXT NOT NULL,
    "allocated_grams" REAL NOT NULL,
    "packed_date" DATETIME,
    "delivery_date" DATETIME,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivery_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "OrderFulfillment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderFulfillment_harvest_record_id_fkey" FOREIGN KEY ("harvest_record_id") REFERENCES "HarvestRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Crop_status_idx" ON "Crop"("status");

-- CreateIndex
CREATE INDEX "ProductVariant_crop_id_idx" ON "ProductVariant"("crop_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeedInventory_crop_id_key" ON "SeedInventory"("crop_id");

-- CreateIndex
CREATE UNIQUE INDEX "PackageInventory_variant_id_key" ON "PackageInventory"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "SampleInventory_crop_id_key" ON "SampleInventory"("crop_id");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Visit_customer_id_idx" ON "Visit"("customer_id");

-- CreateIndex
CREATE INDEX "FollowUp_customer_id_idx" ON "FollowUp"("customer_id");

-- CreateIndex
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

-- CreateIndex
CREATE INDEX "FollowUp_due_date_idx" ON "FollowUp"("due_date");

-- CreateIndex
CREATE INDEX "Order_customer_id_idx" ON "Order"("customer_id");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_product_variant_id_idx" ON "Order"("product_variant_id");

-- CreateIndex
CREATE INDEX "SeedingBatch_crop_id_idx" ON "SeedingBatch"("crop_id");

-- CreateIndex
CREATE INDEX "SeedingBatch_seeding_date_idx" ON "SeedingBatch"("seeding_date");

-- CreateIndex
CREATE INDEX "SeedingBatch_expected_harvest_date_idx" ON "SeedingBatch"("expected_harvest_date");

-- CreateIndex
CREATE INDEX "HarvestRecord_seeding_batch_id_idx" ON "HarvestRecord"("seeding_batch_id");

-- CreateIndex
CREATE INDEX "HarvestRecord_harvest_date_idx" ON "HarvestRecord"("harvest_date");

-- CreateIndex
CREATE INDEX "OrderFulfillment_order_id_idx" ON "OrderFulfillment"("order_id");

-- CreateIndex
CREATE INDEX "OrderFulfillment_harvest_record_id_idx" ON "OrderFulfillment"("harvest_record_id");

-- CreateIndex
CREATE INDEX "OrderFulfillment_delivery_date_idx" ON "OrderFulfillment"("delivery_date");
