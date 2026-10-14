-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "level" SMALLINT NOT NULL DEFAULT 1,
    "path" VARCHAR(255) NOT NULL DEFAULT '',
    "icon_url" VARCHAR(500),
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_leaf" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "idx_categories_parent" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_categories_path" ON "categories"("path");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "categories"
ADD CONSTRAINT "ck_categories_id_unsigned"
CHECK ("id" >= 0),
ADD CONSTRAINT "ck_categories_parent_id_unsigned"
CHECK ("parent_id" >= 0),
ADD CONSTRAINT "ck_categories_level_unsigned"
CHECK ("level" BETWEEN 0 AND 255);
