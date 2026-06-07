import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qciccimnfvlqklqlhvvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaWNjaW1uZnZsb2tzcWxodnZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEzNTIwNiwiZXhwIjoyMDk0NzExMjA2fQ.kdNMnI4h8Ct6d6QmrIhxTaCtgWkuvGixnfoQrMRHYQA'
);

async function checkData() {
  const { data: crops, error } = await supabase
    .from('belarro_v3_crop')
    .select('id, name_en, name_de, flavor, photo_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Total crops: ${crops?.length}`);
    crops?.forEach((crop, i) => {
      console.log(`${i + 1}. ${crop.name_en} (${crop.name_de}) - Flavor: ${crop.flavor} - Photo: ${crop.photo_url ? 'YES' : 'NO'}`);
    });
  }
}

checkData();
