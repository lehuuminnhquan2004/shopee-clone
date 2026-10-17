-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('new', 'used');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'hidden', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "ProductModelStatus" AS ENUM ('active', 'hidden', 'deleted');

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "shop_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "condition_type" "ProductCondition" NOT NULL DEFAULT 'new',
    "weight_gram" INTEGER NOT NULL DEFAULT 0,
    "length_cm" DECIMAL(6,1),
    "width_cm" DECIMAL(6,1),
    "height_cm" DECIMAL(6,1),
    "video_url" VARCHAR(500),
    "has_variants" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "preorder_days" SMALLINT,
    "min_price" BIGINT NOT NULL DEFAULT 0,
    "max_price" BIGINT NOT NULL DEFAULT 0,
    "total_stock" INTEGER NOT NULL DEFAULT 0,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tiers" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "product_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_options" (
    "id" BIGSERIAL NOT NULL,
    "tier_id" BIGINT NOT NULL,
    "value" VARCHAR(50) NOT NULL,
    "image_url" VARCHAR(500),
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "tier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_models" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "sku" VARCHAR(100),
    "name" VARCHAR(100),
    "option_key" VARCHAR(100) NOT NULL DEFAULT '',
    "original_price" BIGINT NOT NULL,
    "price" BIGINT NOT NULL,
    "image_url" VARCHAR(500),
    "status" "ProductModelStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_tier_options" (
    "model_id" BIGINT NOT NULL,
    "tier_option_id" BIGINT NOT NULL,

    CONSTRAINT "model_tier_options_pkey" PRIMARY KEY ("model_id","tier_option_id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "model_id" BIGINT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved_stock" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("model_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_shop" ON "products"("shop_id", "status");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id", "status");

-- CreateIndex
CREATE INDEX "idx_products_sold" ON "products"("sold_count");

-- CreateIndex
CREATE INDEX "idx_products_price" ON "products"("min_price");

-- CreateIndex
CREATE INDEX "idx_pimg_product" ON "product_images"("product_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tier_product_pos" ON "product_tiers"("product_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tieropt_value" ON "tier_options"("tier_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "uq_models_combo" ON "product_models"("product_id", "option_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_models_sku" ON "product_models"("product_id", "sku");

-- CreateIndex
CREATE INDEX "idx_mto_option" ON "model_tier_options"("tier_option_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tiers" ADD CONSTRAINT "product_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_options" ADD CONSTRAINT "tier_options_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "product_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_models" ADD CONSTRAINT "product_models_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_tier_options" ADD CONSTRAINT "model_tier_options_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_tier_options" ADD CONSTRAINT "model_tier_options_tier_option_id_fkey" FOREIGN KEY ("tier_option_id") REFERENCES "tier_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_tiers"
ADD CONSTRAINT "ck_tier_pos"
CHECK ("position" IN (1, 2));

ALTER TABLE "product_models"
ADD CONSTRAINT "ck_models_price"
CHECK ("price" <= "original_price");

ALTER TABLE "inventories"
ADD CONSTRAINT "ck_inv_reserved"
CHECK ("reserved_stock" <= "stock");

ALTER TABLE "inventories"
ADD CONSTRAINT "ck_inv_nonnegative"
CHECK ("stock" >= 0 AND "reserved_stock" >= 0);

ALTER TABLE "product_models"
ADD CONSTRAINT "ck_models_prices_nonnegative"
CHECK ("price" >= 0 AND "original_price" >= 0);

ALTER TABLE "products"
ADD CONSTRAINT "ck_products_counts_nonnegative"
CHECK (
  "weight_gram" >= 0
  AND "total_stock" >= 0
  AND "sold_count" >= 0
  AND "view_count" >= 0
  AND "like_count" >= 0
  AND "rating_count" >= 0
),
ADD CONSTRAINT "ck_products_price_range"
CHECK ("min_price" >= 0 AND "max_price" >= "min_price"),
ADD CONSTRAINT "ck_products_preorder_days"
CHECK ("preorder_days" IS NULL OR "preorder_days" BETWEEN 0 AND 255);

ALTER TABLE "product_images"
ADD CONSTRAINT "ck_pimg_position"
CHECK ("position" BETWEEN 0 AND 255);

ALTER TABLE "tier_options"
ADD CONSTRAINT "ck_tieropt_position"
CHECK ("position" BETWEEN 0 AND 255);