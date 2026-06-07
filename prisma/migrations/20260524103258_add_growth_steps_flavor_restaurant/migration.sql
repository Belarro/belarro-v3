-- AlterTable
ALTER TABLE "Crop" ADD COLUMN "flavor" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "contact_person" TEXT;
ALTER TABLE "Customer" ADD COLUMN "restaurant_name" TEXT;

-- CreateTable
CREATE TABLE "GrowthStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_type" TEXT NOT NULL,
    "duration_hours" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "GrowthStep_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GrowthStep_crop_id_idx" ON "GrowthStep"("crop_id");
