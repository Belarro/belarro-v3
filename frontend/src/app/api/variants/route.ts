import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3NjbXRqZXN5aXppZWJ1dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQwMjgsImV4cCI6MjA4NTYyMDAyOH0.Ikf7mpFUKPJx9wA827xHTxSV2u5JpWCPw7j6wiKbgN0';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('crop_id');

    const fetchUrl = `${SUPABASE_URL}/rest/v1/products?select=*&order=sort_order`;

    const response = await fetch(fetchUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Supabase error: ${response.status}` },
        { status: response.status }
      );
    }

    const products = await response.json();
    const filtered = products.filter((p: any) => p.availability_status !== 'hidden');

    // Extract variants from all products or just one if cropId specified
    let variants: any[] = [];

    if (cropId) {
      const product = filtered.find((p: any) => p.id === cropId);
      if (product) {
        variants = (product.available_sizes || []).map((size: string) => ({
          id: product.id + '-' + size,
          crop_id: product.id,
          size_name: size,
          size_grams: parseInt(size) || 0,
          price_eur: product.prices?.[size] || 0,
        }));
      }
    } else {
      // Return all variants from all crops
      variants = filtered.flatMap((p: any) =>
        (p.available_sizes || []).map((size: string) => ({
          id: p.id + '-' + size,
          crop_id: p.id,
          crop_name: p.name_en,
          size_name: size,
          size_grams: parseInt(size) || 0,
          price_eur: p.prices?.[size] || 0,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      data: variants,
      pagination: {
        page: 1,
        limit: variants.length,
        total: variants.length,
        pages: 1,
      },
    });
  } catch (error) {
    console.error('Variants API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
