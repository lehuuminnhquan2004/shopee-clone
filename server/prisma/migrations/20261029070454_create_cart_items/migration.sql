-- CreateTable
CREATE TABLE "cart_items" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "model_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_cart_model" ON "cart_items"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cart_user_model" ON "cart_items"("user_id", "model_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "ck_cart_qty" CHECK ("quantity" > 0);