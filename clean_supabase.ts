import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  'https://qciccimnfvlqklqlhvvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaWNjaW1uZnZsb2tzcWxodnZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEzNTIwNiwiZXhwIjoyMDk0NzExMjA2fQ.kdNMnI4h8Ct6d6QmrIhxTaCtgWkuvGixnfoQrMRHYQA'
);

async function cleanV3Tables() {
  try {
    console.log('🗑️  Cleaning Belarro V3 tables...\n');

    const tables = [
      'belarro_v3_message',
      'belarro_v3_audit_log',
      'belarro_v3_growth_step',
      'belarro_v3_sales_visit',
      'belarro_v3_standing_order_item',
      'belarro_v3_standing_order',
      'belarro_v3_seed_usage_log',
      'belarro_v3_invoice',
      'belarro_v3_order_fulfillment',
      'belarro_v3_harvest_record',
      'belarro_v3_seeding_batch',
      'belarro_v3_order',
      'belarro_v3_follow_up',
      'belarro_v3_visit',
      'belarro_v3_package_inventory',
      'belarro_v3_sample_inventory',
      'belarro_v3_seed_inventory',
      'belarro_v3_size_template',
      'belarro_v3_product_variant',
      'belarro_v3_crop',
      'belarro_v3_customer',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', ''); // delete all rows

      if (error) {
        console.log(`❌ Error cleaning ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table} cleaned`);
      }
    }

    console.log('\n✓ All V3 tables cleaned. Ready for fresh data.');
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanV3Tables();
