-- Ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  reservation_type VARCHAR(20) NOT NULL CHECK (reservation_type IN ('table', 'preorder')),
  people_count INTEGER NOT NULL DEFAULT 2,
  date DATE NOT NULL,
  time TIME NOT NULL,
  notes TEXT,
  items JSONB DEFAULT '[]',
  total NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
