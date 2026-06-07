-- ============================================
-- BELARRO V3 — CLEAN ALL TABLES
-- ============================================
-- Delete all data from V3 tables (keep structure)

TRUNCATE TABLE belarro_v3_message CASCADE;
TRUNCATE TABLE belarro_v3_audit_log CASCADE;
TRUNCATE TABLE belarro_v3_growth_step CASCADE;
TRUNCATE TABLE belarro_v3_sales_visit CASCADE;
TRUNCATE TABLE belarro_v3_standing_order_item CASCADE;
TRUNCATE TABLE belarro_v3_standing_order CASCADE;
TRUNCATE TABLE belarro_v3_seed_usage_log CASCADE;
TRUNCATE TABLE belarro_v3_invoice CASCADE;
TRUNCATE TABLE belarro_v3_order_fulfillment CASCADE;
TRUNCATE TABLE belarro_v3_harvest_record CASCADE;
TRUNCATE TABLE belarro_v3_seeding_batch CASCADE;
TRUNCATE TABLE belarro_v3_order CASCADE;
TRUNCATE TABLE belarro_v3_follow_up CASCADE;
TRUNCATE TABLE belarro_v3_visit CASCADE;
TRUNCATE TABLE belarro_v3_package_inventory CASCADE;
TRUNCATE TABLE belarro_v3_sample_inventory CASCADE;
TRUNCATE TABLE belarro_v3_seed_inventory CASCADE;
TRUNCATE TABLE belarro_v3_size_template CASCADE;
TRUNCATE TABLE belarro_v3_product_variant CASCADE;
TRUNCATE TABLE belarro_v3_crop CASCADE;
TRUNCATE TABLE belarro_v3_customer CASCADE;

-- Verify all tables are empty
SELECT 'belarro_v3_crop' as table_name, COUNT(*) as row_count FROM belarro_v3_crop
UNION ALL
SELECT 'belarro_v3_customer', COUNT(*) FROM belarro_v3_customer
UNION ALL
SELECT 'belarro_v3_product_variant', COUNT(*) FROM belarro_v3_product_variant
UNION ALL
SELECT 'belarro_v3_order', COUNT(*) FROM belarro_v3_order
UNION ALL
SELECT 'belarro_v3_follow_up', COUNT(*) FROM belarro_v3_follow_up;
