-- ============================================
-- SCHEMA - SISTEMA GASTRONÓMICO v2.0
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  allergens TEXT[] DEFAULT '{}',
  preparation_time INTEGER,
  sort_order INTEGER DEFAULT 0,
  track_stock BOOLEAN DEFAULT FALSE,
  stock INTEGER,
  stock_alert INTEGER DEFAULT 5,
  is_combo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODIFIER GROUPS
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  multiple BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODIFIERS
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE
);

-- STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLES
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(20) NOT NULL UNIQUE,
  capacity INTEGER DEFAULT 4,
  status VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'pending', 'reserved')),
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  shape VARCHAR(20) DEFAULT 'square' CHECK (shape IN ('square', 'round')),
  zone VARCHAR(100),
  current_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  min_order_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery', 'counter')),
  table_id UUID REFERENCES tables(id),
  table_number VARCHAR(20),
  delivery_address TEXT,
  delivery_notes TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_id UUID REFERENCES discounts(id),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('mercadopago', 'cash', 'transfer', 'card', 'other')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(255),
  mp_preference_id VARCHAR(255),
  waiter_name VARCHAR(100),
  notes TEXT,
  printed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  modifiers JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUSINESS CONFIG
CREATE TABLE IF NOT EXISTS business_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(200) NOT NULL DEFAULT 'Mi Restaurante',
  business_type VARCHAR(100) DEFAULT 'Restaurante',
  address TEXT DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  logo_url TEXT,
  opening_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "23:00", "is_open": true},
    "tuesday": {"open": "09:00", "close": "23:00", "is_open": true},
    "wednesday": {"open": "09:00", "close": "23:00", "is_open": true},
    "thursday": {"open": "09:00", "close": "23:00", "is_open": true},
    "friday": {"open": "09:00", "close": "00:00", "is_open": true},
    "saturday": {"open": "10:00", "close": "00:00", "is_open": true},
    "sunday": {"open": "10:00", "close": "22:00", "is_open": true}
  }',
  is_open BOOLEAN DEFAULT TRUE,
  delivery_available BOOLEAN DEFAULT TRUE,
  takeaway_available BOOLEAN DEFAULT TRUE,
  dine_in_available BOOLEAN DEFAULT TRUE,
  counter_available BOOLEAN DEFAULT TRUE,
  currency VARCHAR(10) DEFAULT 'ARS',
  currency_symbol VARCHAR(5) DEFAULT '$',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  waiter_pin VARCHAR(10) DEFAULT '1234',
  primary_color VARCHAR(20) DEFAULT '#1a1a2e',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Políticas service role
CREATE POLICY "Service role all admins" ON admins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Service role all products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read available products" ON products FOR SELECT USING (is_available = true);
CREATE POLICY "Service role all orders" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all order_items" ON order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all tables" ON tables FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Service role all customers" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all discounts" ON discounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read active discounts" ON discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Service role all config" ON business_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read config" ON business_config FOR SELECT USING (true);
CREATE POLICY "Service role all modifier_groups" ON modifier_groups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read modifier_groups" ON modifier_groups FOR SELECT USING (true);
CREATE POLICY "Service role all modifiers" ON modifiers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read modifiers" ON modifiers FOR SELECT USING (true);
CREATE POLICY "Service role all stock" ON stock_movements FOR ALL USING (auth.role() = 'service_role');

-- DATOS INICIALES
INSERT INTO business_config (business_name, business_type, is_open) 
VALUES ('Mi Restaurante', 'Restaurante', true) ON CONFLICT DO NOTHING;

-- Admin inicial (contraseña: Admin2024!)
INSERT INTO admins (name, email, password_hash, role) VALUES (
  'Administrador', 'admin@restaurante.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hFVBU5pHy',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Mesas de ejemplo
INSERT INTO tables (number, capacity, shape, zone, position_x, position_y) VALUES
  ('1', 2, 'round', 'Salón', 100, 100),
  ('2', 4, 'square', 'Salón', 220, 100),
  ('3', 4, 'square', 'Salón', 340, 100),
  ('4', 6, 'square', 'Salón', 100, 220),
  ('5', 4, 'round', 'Terraza', 340, 220),
  ('6', 2, 'round', 'Terraza', 460, 220)
ON CONFLICT (number) DO NOTHING;

COMMENT ON TABLE admins IS 'Contraseña inicial: Admin2024!';
