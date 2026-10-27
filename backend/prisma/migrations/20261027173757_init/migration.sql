CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE "user_role" AS ENUM ('admin', 'viewer');

CREATE TYPE "product_category" AS ENUM ('meal', 'drink', 'dessert', 'side');

CREATE TYPE "order_status" AS ENUM ('pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled');

CREATE TYPE "vehicle_type" AS ENUM ('bicycle', 'motorcycle', 'car');

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category" "product_category" NOT NULL,
    "image_url" VARCHAR(500),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "preparation_time" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_persons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "vehicle_type" "vehicle_type" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "delivery_persons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "delivery_address" VARCHAR(300) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "delivery_person_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "from_status" "order_status",
    "to_status" "order_status" NOT NULL,
    "changed_by_id" UUID,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

CREATE INDEX "products_category_idx" ON "products"("category");

CREATE INDEX "products_is_available_idx" ON "products"("is_available");

CREATE INDEX "products_name_idx" ON "products"("name");

CREATE INDEX "products_created_at_idx" ON "products"("created_at" DESC);

CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "delivery_persons_is_active_idx" ON "delivery_persons"("is_active");

CREATE INDEX "orders_status_idx" ON "orders"("status");

CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

CREATE INDEX "orders_delivery_person_id_idx" ON "orders"("delivery_person_id");

CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

CREATE UNIQUE INDEX "order_items_order_id_product_id_key" ON "order_items"("order_id", "product_id");

CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

CREATE INDEX "order_status_history_to_status_changed_at_idx" ON "order_status_history"("to_status", "changed_at");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_person_id_fkey" FOREIGN KEY ("delivery_person_id") REFERENCES "delivery_persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products"
    ADD CONSTRAINT "products_price_positive" CHECK ("price" > 0),
    ADD CONSTRAINT "products_preparation_time_range" CHECK ("preparation_time" BETWEEN 1 AND 120),
    ADD CONSTRAINT "products_name_length" CHECK (char_length("name") BETWEEN 3 AND 120),
    ADD CONSTRAINT "products_description_length" CHECK (char_length("description") BETWEEN 10 AND 500);

ALTER TABLE "delivery_persons"
    ADD CONSTRAINT "delivery_persons_coordinates_pair" CHECK (("current_latitude" IS NULL) = ("current_longitude" IS NULL)),
    ADD CONSTRAINT "delivery_persons_latitude_range" CHECK ("current_latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "delivery_persons_longitude_range" CHECK ("current_longitude" BETWEEN -180 AND 180);

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_total_amount_positive" CHECK ("total_amount" > 0),
    ADD CONSTRAINT "orders_latitude_range" CHECK ("latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "orders_longitude_range" CHECK ("longitude" BETWEEN -180 AND 180),
    ADD CONSTRAINT "orders_delivering_requires_person" CHECK ("status" NOT IN ('delivering', 'delivered') OR "delivery_person_id" IS NOT NULL);

ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0),
    ADD CONSTRAINT "order_items_unit_price_positive" CHECK ("unit_price" > 0);

CREATE UNIQUE INDEX "orders_one_delivering_per_person_idx"
    ON "orders" ("delivery_person_id")
    WHERE "status" = 'delivering';

CREATE INDEX "products_active_created_at_idx"
    ON "products" ("created_at" DESC)
    WHERE "deleted_at" IS NULL;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_set_updated_at" BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "products_set_updated_at" BEFORE UPDATE ON "products"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "delivery_persons_set_updated_at" BEFORE UPDATE ON "delivery_persons"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "orders_set_updated_at" BEFORE UPDATE ON "orders"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
