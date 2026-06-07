// Direct API endpoint to fetch crops from Supabase
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
    const anonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3NjbXRqZXN5aXppZWJ1dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQwMjgsImV4cCI6MjA4NTYyMDAyOH0.Ikf7mpFUKPJx9wA827xHTxSV2u5JpWCPw7j6wiKbgN0';

    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=*&order=sort_order`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Supabase');
    }

    const products = await response.json();

    // Filter out hidden products
    const crops = products
      .filter(p => p.availability_status !== 'hidden')
      .map(p => ({
        id: p.id,
        name_en: p.name_en || p.name,
        name_de: p.name_de,
        flavor: p.flavor_profile,
        photo_url: p.photo,
        seeds_per_tray: p.growing_procedure?.seeds_per_tray || 0,
        yield_per_tray: p.yield_per_tray ? parseFloat(p.yield_per_tray) : 0,
        total_growth_days: 14,
        seeding_schedule: 'TUESDAY',
        status: 'active',
        created_at: p.created_at,
        updated_at: p.updated_at,
        variants: p.available_sizes?.map(size => ({
          id: p.id + '-' + size,
          size_name: size,
          size_grams: parseFloat(size) || 0,
          price_eur: p.prices?.[size] || 0,
        })) || [],
        growth_steps: p.growing_stages || [],
        seed_inventory: [],
      }));

    res.status(200).json({
      success: true,
      data: crops,
      pagination: {
        page: 1,
        limit: crops.length,
        total: crops.length,
        pages: 1,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crops',
      message: error.message,
    });
  }
};
