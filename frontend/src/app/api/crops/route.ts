import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3NjbXRqZXN5aXppZWJ1dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQwMjgsImV4cCI6MjA4NTYyMDAyOH0.Ikf7mpFUKPJx9wA827xHTxSV2u5JpWCPw7j6wiKbgN0';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const fetchUrl = `${SUPABASE_URL}/rest/v1/products?select=*&order=sort_order`;

    const response = await fetch(fetchUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Supabase error: ${response.status} - ${error}` },
        { status: response.status }
      );
    }

    const products = await response.json();

    // Filter non-hidden products
    const filtered = products.filter((p: any) => p.availability_status !== 'hidden');

    // Map to app format
    const crops = filtered.map((p: any) => ({
      id: p.id,
      name_en: p.name_en,
      name_de: p.name_de,
      flavor: p.flavor_profile,
      photo_url: p.photo,
      seeds_per_tray: p.growing_procedure?.seeds_per_tray || 0,
      yield_per_tray: p.yield_per_tray ? parseInt(p.yield_per_tray) : 0,
      total_growth_days: 14,
      seeding_schedule: 'TUESDAY',
      status: p.availability_status === 'available' ? 'active' : (p.availability_status === 'paused' ? 'paused' : 'inactive'),
      created_at: p.created_at,
      updated_at: p.updated_at,
      variants: (p.available_sizes || []).map((size: string) => ({
        id: p.id + '-' + size,
        size_name: size,
        size_grams: parseInt(size) || 0,
        price_eur: p.prices?.[size] || 0,
      })),
      growth_steps: p.growing_stages || [],
      seed_inventory: [],
    }));

    return NextResponse.json({
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
    console.error('Crops API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
