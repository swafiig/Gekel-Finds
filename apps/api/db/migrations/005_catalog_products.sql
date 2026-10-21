-- Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers (extends your existing users table, but keeps supplier profile separate)
CREATE TABLE IF NOT EXISTS supplier_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shop_name VARCHAR(150) NOT NULL,
    market VARCHAR(100) NOT NULL,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    rating NUMERIC(2, 1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id),
    subcategory_id UUID REFERENCES subcategories(id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price INT NOT NULL, -- in KSh
    old_price INT,
    image_url TEXT,
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_flash_sale BOOLEAN DEFAULT FALSE,
    flash_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast reads
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
