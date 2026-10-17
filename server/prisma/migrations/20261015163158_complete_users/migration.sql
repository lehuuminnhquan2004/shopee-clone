/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('buyer', 'seller', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'locked', 'deleted');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('pending', 'active', 'suspended', 'closed');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" VARCHAR(500),
ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(3),
ADD COLUMN     "email_verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "last_login_at" TIMESTAMPTZ(3),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "phone_verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'buyer',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "shops" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "status" "ShopStatus" NOT NULL DEFAULT 'pending',
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "response_rate" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_owner_id_key" ON "shops"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
