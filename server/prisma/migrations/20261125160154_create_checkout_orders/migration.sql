-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bank_transfer', 'card', 'ewallet');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending_payment', 'pending_confirm', 'to_ship', 'shipping', 'delivered', 'completed', 'cancelled', 'return_refund');

-- CreateEnum
CREATE TYPE "OrderCancelledBy" AS ENUM ('buyer', 'seller', 'system');

-- CreateTable
CREATE TABLE "checkouts" (
    "id" BIGSERIAL NOT NULL,
    "checkout_code" VARCHAR(30) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "shipping_total" BIGINT NOT NULL DEFAULT 0,
    "discount_total" BIGINT NOT NULL DEFAULT 0,
    "grand_total" BIGINT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "idempotency_key" UUID NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_code" VARCHAR(30) NOT NULL,
    "checkout_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "shop_id" BIGINT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending_confirm',
    "receiver_name" VARCHAR(100) NOT NULL,
    "receiver_phone" VARCHAR(20) NOT NULL,
    "shipping_address" VARCHAR(500) NOT NULL,
    "province_id" INTEGER,
    "ward_id" INTEGER,
    "subtotal" BIGINT NOT NULL,
    "shipping_fee" BIGINT NOT NULL DEFAULT 0,
    "shop_voucher_discount" BIGINT NOT NULL DEFAULT 0,
    "platform_voucher_discount" BIGINT NOT NULL DEFAULT 0,
    "total_amount" BIGINT NOT NULL,
    "buyer_note" VARCHAR(500),
    "cancel_reason" VARCHAR(255),
    "cancelled_by" "OrderCancelledBy",
    "paid_at" TIMESTAMPTZ(3),
    "confirmed_at" TIMESTAMPTZ(3),
    "shipped_at" TIMESTAMPTZ(3),
    "delivered_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "model_id" BIGINT,
    "product_name" VARCHAR(255) NOT NULL,
    "model_name" VARCHAR(100),
    "sku" VARCHAR(100),
    "image_url" VARCHAR(500),
    "unit_price" BIGINT NOT NULL,
    "original_price" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" BIGINT NOT NULL,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkouts_checkout_code_key" ON "checkouts"("checkout_code");

-- CreateIndex
CREATE INDEX "idx_checkouts_user" ON "checkouts"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_checkouts_user_idempotency" ON "checkouts"("user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE INDEX "idx_orders_user" ON "orders"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_orders_shop" ON "orders"("shop_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_orders_checkout_shop" ON "orders"("checkout_id", "shop_id");

-- CreateIndex
CREATE INDEX "idx_oi_order" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_oi_product" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_oi_model" ON "order_items"("model_id");

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "checkouts"
ADD CONSTRAINT "ck_checkouts_money_nonnegative"
CHECK (
    "subtotal" >= 0
    AND "shipping_total" >= 0
    AND "discount_total" >= 0
    AND "grand_total" >= 0
),
ADD CONSTRAINT "ck_checkouts_grand_total"
CHECK (
    "grand_total"::numeric =
        "subtotal"::numeric
        + "shipping_total"
        - "discount_total"
);

-- Order: tiền không âm và tổng tiền đúng công thức.
ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_money_nonnegative"
CHECK (
    "subtotal" >= 0
    AND "shipping_fee" >= 0
    AND "shop_voucher_discount" >= 0
    AND "platform_voucher_discount" >= 0
    AND "total_amount" >= 0
),
ADD CONSTRAINT "ck_orders_total_amount"
CHECK (
    "total_amount"::numeric =
        "subtotal"::numeric
        + "shipping_fee"
        - "shop_voucher_discount"
        - "platform_voucher_discount"
);

-- OrderItem: số lượng dương, tiền không âm, thành tiền đúng.
ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_quantity"
CHECK ("quantity" > 0),
ADD CONSTRAINT "ck_order_items_money_nonnegative"
CHECK (
    "unit_price" >= 0
    AND "original_price" >= 0
    AND "line_total" >= 0
),
ADD CONSTRAINT "ck_order_items_line_total"
CHECK (
    "line_total"::numeric =
        "unit_price"::numeric * "quantity"
);