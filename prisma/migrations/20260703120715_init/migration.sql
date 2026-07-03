-- CreateEnum
CREATE TYPE "charge_unit" AS ENUM ('per_ft', 'per_day', 'per_hole', 'fixed');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "job_item_type" AS ENUM ('DRILLING', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "payment_mode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR');

-- CreateTable
CREATE TABLE "borewell_types" (
    "id" SERIAL NOT NULL,
    "diameter_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borewell_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drilling_rate_slabs" (
    "id" SERIAL NOT NULL,
    "borewell_type_id" INTEGER NOT NULL,
    "start_depth" INTEGER NOT NULL,
    "end_depth" INTEGER NOT NULL,
    "price_per_ft" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drilling_rate_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_charge_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "additional_charge_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_charge_rates" (
    "id" SERIAL NOT NULL,
    "additional_charge_type_id" INTEGER NOT NULL,
    "borewell_type_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "unit" "charge_unit" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "additional_charge_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "customer_name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT,
    "village" TEXT,
    "taluk" TEXT,
    "district" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borewell_jobs" (
    "id" SERIAL NOT NULL,
    "bill_number" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "borewell_type_id" INTEGER NOT NULL,
    "drilling_date" TIMESTAMP(3) NOT NULL,
    "total_depth" INTEGER NOT NULL,
    "water_level" INTEGER,
    "remarks" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'UNPAID',
    "cancelled_at" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "borewell_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_items" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "item_type" "job_item_type" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "job_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_mode" "payment_mode" NOT NULL,
    "reference_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'OPERATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_change_history" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" INTEGER NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by_id" INTEGER,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "footer_text" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gst_enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "bill_prefix" TEXT NOT NULL DEFAULT 'VB',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drilling_rate_slabs_borewell_type_id_start_depth_idx" ON "drilling_rate_slabs"("borewell_type_id", "start_depth");

-- CreateIndex
CREATE UNIQUE INDEX "additional_charge_rates_additional_charge_type_id_borewell__key" ON "additional_charge_rates"("additional_charge_type_id", "borewell_type_id");

-- CreateIndex
CREATE INDEX "customers_mobile_idx" ON "customers"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "borewell_jobs_bill_number_key" ON "borewell_jobs"("bill_number");

-- CreateIndex
CREATE INDEX "borewell_jobs_customer_id_idx" ON "borewell_jobs"("customer_id");

-- CreateIndex
CREATE INDEX "borewell_jobs_drilling_date_idx" ON "borewell_jobs"("drilling_date");

-- CreateIndex
CREATE INDEX "job_items_job_id_idx" ON "job_items"("job_id");

-- CreateIndex
CREATE INDEX "payments_job_id_idx" ON "payments"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "rate_change_history_table_name_record_id_idx" ON "rate_change_history"("table_name", "record_id");

-- AddForeignKey
ALTER TABLE "drilling_rate_slabs" ADD CONSTRAINT "drilling_rate_slabs_borewell_type_id_fkey" FOREIGN KEY ("borewell_type_id") REFERENCES "borewell_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_charge_rates" ADD CONSTRAINT "additional_charge_rates_additional_charge_type_id_fkey" FOREIGN KEY ("additional_charge_type_id") REFERENCES "additional_charge_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_charge_rates" ADD CONSTRAINT "additional_charge_rates_borewell_type_id_fkey" FOREIGN KEY ("borewell_type_id") REFERENCES "borewell_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borewell_jobs" ADD CONSTRAINT "borewell_jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borewell_jobs" ADD CONSTRAINT "borewell_jobs_borewell_type_id_fkey" FOREIGN KEY ("borewell_type_id") REFERENCES "borewell_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borewell_jobs" ADD CONSTRAINT "borewell_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "borewell_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "borewell_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_change_history" ADD CONSTRAINT "rate_change_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
