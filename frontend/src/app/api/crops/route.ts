import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3NjbXRqZXN5aXppZWJ1dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQwMjgsImV4cCI6MjA4NTYyMDAyOH0.Ikf7mpFUKPJx9wA827xHTxSV2u5JpWCPw7j6wiKbgN0';

function mapProduct(p: any) {
  const procedure = typeof p.growing_procedure === 'string' ? JSON.parse(p.growing_procedure) : p.growing_procedure || {};

  return {
    id: p.id,
    name_en: p.name_en,
    name_de: p.name_de,
    flavor: p.flavor_profile,
    photo_url: p.photo,
    seeds_per_tray: p.seeds_per_tray || procedure.seeds_per_tray || 0,
    yield_per_tray: p.yield_per_tray ? parseInt(p.yield_per_tray) : (procedure.yield_per_tray || 0),
    total_growth_days: procedure.total_growth_days || 14,
    seeding_schedule: procedure.seeding_schedule || 'TUESDAY',
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
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('id');

    if (cropId) {
      const fetchUrl = `${SUPABASE_URL}/rest/v1/products?id=eq.${cropId}&select=*`;
      const response = await fetch(fetchUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch crop' },
          { status: 404 }
        );
      }

      const products = await response.json();
      if (products.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Crop not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: mapProduct(products[0]),
      });
    }

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
    const filtered = products.filter((p: any) => p.availability_status !== 'hidden');
    const crops = filtered.map(mapProduct);

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

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('id');

    if (!cropId) {
      return NextResponse.json(
        { success: false, error: 'Crop ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name_en, name_de, flavor, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule, status } = body;

    // Fetch current product to get existing growing_procedure
    const getCurrentUrl = `${SUPABASE_URL}/rest/v1/products?id=eq.${cropId}&select=growing_procedure`;
    const getCurrentRes = await fetch(getCurrentUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    let currentProcedure: Record<string, any> = {};
    if (getCurrentRes.ok) {
      const currentData = await getCurrentRes.json();
      if (currentData.length > 0) {
        const data = currentData[0];
        currentProcedure = typeof data.growing_procedure === 'string'
          ? JSON.parse(data.growing_procedure)
          : data.growing_procedure || {};
      }
    }

    const updatePayload: Record<string, any> = {};

    if (name_en !== undefined) updatePayload.name_en = name_en;
    if (name_de !== undefined) updatePayload.name_de = name_de;
    if (flavor !== undefined) updatePayload.flavor_profile = flavor;
    if (yield_per_tray !== undefined) updatePayload.yield_per_tray = yield_per_tray?.toString();
    if (status !== undefined) {
      const statusMap: Record<string, string> = {
        active: 'available',
        paused: 'paused',
        inactive: 'hidden',
      };
      updatePayload.availability_status = statusMap[status] || status;
    }

    // Merge procedure fields
    const procedureUpdates: Record<string, any> = {};
    if (seeds_per_tray !== undefined) procedureUpdates.seeds_per_tray = parseFloat(seeds_per_tray as string);
    if (total_growth_days !== undefined) procedureUpdates.total_growth_days = parseInt(total_growth_days as string);
    if (seeding_schedule !== undefined) procedureUpdates.seeding_schedule = seeding_schedule;

    if (Object.keys(procedureUpdates).length > 0) {
      updatePayload.growing_procedure = { ...currentProcedure, ...procedureUpdates };
    }

    console.log('Update payload:', updatePayload, 'Body:', body);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const fetchUrl = `${SUPABASE_URL}/rest/v1/products?id=eq.${cropId}`;

    const response = await fetch(fetchUrl, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Supabase update error:', error, 'Payload:', updatePayload);
      return NextResponse.json(
        { success: false, error: `Failed to update: ${error}` },
        { status: response.status }
      );
    }

    const products = await response.json();
    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Crop not found after update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapProduct(Array.isArray(products) ? products[0] : products),
    });
  } catch (error) {
    console.error('Crops update error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
