CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    color VARCHAR(50),
    size VARCHAR(20),
    price_delta INT NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id),
    ADD COLUMN IF NOT EXISTS variant_label VARCHAR(100);