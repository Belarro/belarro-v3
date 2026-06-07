-- ============================================
-- BELARRO V3 — SUPABASE MIGRATION SCRIPT
-- ============================================
-- This script creates all V3 tables with belarro_v3_ prefix
-- V2 tables remain untouched for backup/rollback

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CROPS & PRODUCTS
-- ============================================

CREATE TABLE belarro_v3_crop (
  id TEXT PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_de VARCHAR(255) NOT NULL,
  photo_url TEXT,
  flavor VARCHAR(255),
  seeds_per_tray FLOAT8 NOT NULL,
  yield_per_tray FLOAT8 NOT NULL,
  total_growth_days INT NOT NULL,
  seeding_schedule VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_belarro_v3_crop_status ON belarro_v3_crop(status);
CREATE INDEX idx_belarro_v3_crop_deleted_at ON belarro_v3_crop(deleted_at);

CREATE TABLE belarro_v3_product_variant (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES belarro_v3_crop(id) ON DELETE CASCADE,
  size_name VARCHAR(255) NOT NULL,
  size_grams FLOAT8 NOT NULL,
  price_eur FLOAT8 NOT NULL,
  container_qty INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_product_variant_crop_id ON belarro_v3_product_variant(crop_id);

CREATE TABLE belarro_v3_size_template (
  id TEXT PRIMARY KEY,
  size_name VARCHAR(255) UNIQUE NOT NULL,
  size_grams FLOAT8 NOT NULL,
  price_eur FLOAT8 NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVENTORY
-- ============================================

CREATE TABLE belarro_v3_seed_inventory (
  id TEXT PRIMARY KEY,
  crop_id TEXT UNIQUE NOT NULL REFERENCES belarro_v3_crop(id) ON DELETE CASCADE,
  quantity_grams FLOAT8 DEFAULT 0,
  reorder_threshold_trays INT DEFAULT 20,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_qty_grams FLOAT8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE belarro_v3_package_inventory (
  id TEXT PRIMARY KEY,
  variant_id TEXT UNIQUE NOT NULL REFERENCES belarro_v3_product_variant(id) ON DELETE CASCADE,
  quantity_available INT DEFAULT 0,
  reorder_threshold INT DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE belarro_v3_sample_inventory (
  id TEXT PRIMARY KEY,
  crop_id TEXT UNIQUE NOT NULL REFERENCES belarro_v3_crop(id) ON DELETE CASCADE,
  available_grams FLOAT8 DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS & RELATIONSHIPS
-- ============================================

CREATE TABLE belarro_v3_customer (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  restaurant_name VARCHAR(255),
  contact_person VARCHAR(255),
  address TEXT,
  city VARCHAR(255),
  email VARCHAR(255),
  whatsapp VARCHAR(255),
  phone VARCHAR(255),
  status VARCHAR(50) DEFAULT 'prospect',
  net_days INT DEFAULT 30,
  first_contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_customer_status ON belarro_v3_customer(status);
CREATE INDEX idx_belarro_v3_customer_email ON belarro_v3_customer(email);

CREATE TABLE belarro_v3_visit (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES belarro_v3_customer(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_visit_customer_id ON belarro_v3_visit(customer_id);

CREATE TABLE belarro_v3_follow_up (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES belarro_v3_customer(id) ON DELETE CASCADE,
  follow_up_number INT NOT NULL,
  follow_up_days INT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_via VARCHAR(50),
  sent_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_follow_up_customer_id ON belarro_v3_follow_up(customer_id);
CREATE INDEX idx_belarro_v3_follow_up_status ON belarro_v3_follow_up(status);
CREATE INDEX idx_belarro_v3_follow_up_due_date ON belarro_v3_follow_up(due_date);

-- ============================================
-- ORDERS & FULFILLMENT
-- ============================================

CREATE TABLE belarro_v3_order (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES belarro_v3_customer(id) ON DELETE CASCADE,
  product_variant_id TEXT NOT NULL REFERENCES belarro_v3_product_variant(id) ON DELETE CASCADE,
  quantity FLOAT8 NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_delivery_date TIMESTAMP WITH TIME ZONE,
  expected_harvest_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending_seed',
  recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_order_customer_id ON belarro_v3_order(customer_id);
CREATE INDEX idx_belarro_v3_order_status ON belarro_v3_order(status);
CREATE INDEX idx_belarro_v3_order_product_variant_id ON belarro_v3_order(product_variant_id);

-- ============================================
-- SEEDING & HARVESTING
-- ============================================

CREATE TABLE belarro_v3_seeding_batch (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES belarro_v3_crop(id) ON DELETE CASCADE,
  seeding_date TIMESTAMP WITH TIME ZONE NOT NULL,
  quantity_trays INT NOT NULL,
  batch_type VARCHAR(50) NOT NULL,
  expected_harvest_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_seeding_batch_crop_id ON belarro_v3_seeding_batch(crop_id);
CREATE INDEX idx_belarro_v3_seeding_batch_seeding_date ON belarro_v3_seeding_batch(seeding_date);
CREATE INDEX idx_belarro_v3_seeding_batch_expected_harvest_date ON belarro_v3_seeding_batch(expected_harvest_date);

CREATE TABLE belarro_v3_harvest_record (
  id TEXT PRIMARY KEY,
  seeding_batch_id TEXT NOT NULL REFERENCES belarro_v3_seeding_batch(id) ON DELETE CASCADE,
  harvest_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_yield_grams FLOAT8 NOT NULL,
  yield_used_for_orders_grams FLOAT8 DEFAULT 0,
  yield_available_samples_grams FLOAT8 DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_harvest_record_seeding_batch_id ON belarro_v3_harvest_record(seeding_batch_id);
CREATE INDEX idx_belarro_v3_harvest_record_harvest_date ON belarro_v3_harvest_record(harvest_date);

CREATE TABLE belarro_v3_order_fulfillment (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES belarro_v3_order(id) ON DELETE CASCADE,
  harvest_record_id TEXT NOT NULL REFERENCES belarro_v3_harvest_record(id) ON DELETE CASCADE,
  allocated_grams FLOAT8 NOT NULL,
  packed_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  delivered BOOLEAN DEFAULT FALSE,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_order_fulfillment_order_id ON belarro_v3_order_fulfillment(order_id);
CREATE INDEX idx_belarro_v3_order_fulfillment_harvest_record_id ON belarro_v3_order_fulfillment(harvest_record_id);
CREATE INDEX idx_belarro_v3_order_fulfillment_delivery_date ON belarro_v3_order_fulfillment(delivery_date);

-- ============================================
-- INVOICING
-- ============================================

CREATE TABLE belarro_v3_invoice (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES belarro_v3_customer(id) ON DELETE CASCADE,
  invoice_month VARCHAR(7) NOT NULL,
  total_amount_eur FLOAT8 NOT NULL,
  vat_amount_eur FLOAT8,
  status VARCHAR(50) DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, invoice_month)
);

CREATE INDEX idx_belarro_v3_invoice_customer_id ON belarro_v3_invoice(customer_id);
CREATE INDEX idx_belarro_v3_invoice_invoice_month ON belarro_v3_invoice(invoice_month);

-- ============================================
-- SEED TRACKING
-- ============================================

CREATE TABLE belarro_v3_seed_usage_log (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES belarro_v3_crop(id) ON DELETE CASCADE,
  quantity_used_grams FLOAT8 NOT NULL,
  trays_seeded INT NOT NULL,
  seeded_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_seed_usage_log_crop_id ON belarro_v3_seed_usage_log(crop_id);
CREATE INDEX idx_belarro_v3_seed_usage_log_seeded_date ON belarro_v3_seed_usage_log(seeded_date);

-- ============================================
-- STANDING ORDERS
-- ============================================

CREATE TABLE belarro_v3_standing_order (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES belarro_v3_customer(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_standing_order_customer_id ON belarro_v3_standing_order(customer_id);
CREATE INDEX idx_belarro_v3_standing_order_status ON belarro_v3_standing_order(status);

CREATE TABLE belarro_v3_standing_order_item (
  id TEXT PRIMARY KEY,
  standing_order_id TEXT NOT NULL REFERENCES belarro_v3_standing_order(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES belarro_v3_product_variant(id) ON DELETE CASCADE,
  size_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price_at_time_eur FLOAT8 NOT NULL,
  delivery_day_of_week INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_standing_order_item_standing_order_id ON belarro_v3_standing_order_item(standing_order_id);
CREATE INDEX idx_belarro_v3_standing_order_item_variant_id ON belarro_v3_standing_order_item(variant_id);

-- ============================================
-- SALES VISITS
-- ============================================

CREATE TABLE belarro_v3_sales_visit (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES belarro_v3_customer(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  outcome VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_sales_visit_customer_id ON belarro_v3_sales_visit(customer_id);
CREATE INDEX idx_belarro_v3_sales_visit_visit_date ON belarro_v3_sales_visit(visit_date);

-- ============================================
-- MESSAGES
-- ============================================

CREATE TABLE belarro_v3_message (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  order_id TEXT REFERENCES belarro_v3_order(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_message_from_user_id ON belarro_v3_message(from_user_id);
CREATE INDEX idx_belarro_v3_message_to_user_id ON belarro_v3_message(to_user_id);
CREATE INDEX idx_belarro_v3_message_order_id ON belarro_v3_message(order_id);

-- ============================================
-- GROWTH PROCEDURES
-- ============================================

CREATE TABLE belarro_v3_growth_step (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES belarro_v3_crop(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  duration_hours INT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_growth_step_crop_id ON belarro_v3_growth_step(crop_id);

-- ============================================
-- AUDIT LOG — DATA PROTECTION
-- ============================================

CREATE TABLE belarro_v3_audit_log (
  id TEXT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id TEXT NOT NULL,
  user_id TEXT,
  old_values TEXT,
  new_values TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belarro_v3_audit_log_entity_type ON belarro_v3_audit_log(entity_type);
CREATE INDEX idx_belarro_v3_audit_log_entity_id ON belarro_v3_audit_log(entity_id);
CREATE INDEX idx_belarro_v3_audit_log_action ON belarro_v3_audit_log(action);
CREATE INDEX idx_belarro_v3_audit_log_created_at ON belarro_v3_audit_log(created_at);

-- ============================================
-- STORAGE: Create bucket for photos
-- ============================================
-- Note: Run this separately in Supabase dashboard or via REST API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('belarro-v3-photos', 'belarro-v3-photos', true);
