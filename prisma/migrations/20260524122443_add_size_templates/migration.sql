-- CreateTable
CREATE TABLE "SizeTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "size_name" TEXT NOT NULL,
    "size_grams" REAL NOT NULL,
    "price_eur" REAL NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GrowthStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_type" TEXT NOT NULL,
    "duration_hours" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "GrowthStep_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GrowthStep" ("created_at", "crop_id", "duration_hours", "id", "notes", "step_order", "step_type", "updated_at") SELECT "created_at", "crop_id", "duration_hours", "id", "notes", "step_order", "step_type", "updated_at" FROM "GrowthStep";
DROP TABLE "GrowthStep";
ALTER TABLE "new_GrowthStep" RENAME TO "GrowthStep";
CREATE INDEX "GrowthStep_crop_id_idx" ON "GrowthStep"("crop_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SizeTemplate_size_name_key" ON "SizeTemplate"("size_name");
