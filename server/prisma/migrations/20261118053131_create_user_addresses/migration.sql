-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('home', 'office');

-- CreateTable
CREATE TABLE "provinces" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" SERIAL NOT NULL,
    "province_id" INTEGER NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "receiver_name" VARCHAR(100) NOT NULL,
    "receiver_phone" VARCHAR(20) NOT NULL,
    "address_detail" VARCHAR(255) NOT NULL,
    "address_type" "AddressType" NOT NULL DEFAULT 'home',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wards_code_key" ON "wards"("code");

-- CreateIndex
CREATE INDEX "idx_wards_province" ON "wards"("province_id");

-- CreateIndex
CREATE INDEX "idx_addr_user" ON "user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "idx_addr_ward" ON "user_addresses"("ward_id");

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mỗi người dùng có tối đa một địa chỉ mặc định chưa bị xóa.
CREATE UNIQUE INDEX "uq_user_addresses_active_default"
ON "user_addresses" ("user_id")
WHERE "is_default" = true
  AND "deleted_at" IS NULL;