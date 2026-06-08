import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3NjbXRqZXN5aXppZWJ1dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQwMjgsImV4cCI6MjA4NTYyMDAyOH0.Ikf7mpFUKPJx9wA827xHTxSV2u5JpWCPw7j6wiKbgN0';

export async function GET(request: NextRequest) {
  try {
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

    const activeCrops = filtered.filter((p: any) => p.availability_status === 'available').length;
    const totalVariants = filtered.reduce((sum: number, p: any) => sum + (p.available_sizes?.length || 0), 0);
    const avgYield = filtered.reduce((sum: number, p: any) => sum + (p.yield_per_tray || 0), 0) / filtered.length;

    const dashboard = {
      overview: {
        active_crops: activeCrops,
        total_crops: filtered.length,
        active_customers: 0,
        total_customers: 0,
        pending_orders: 0,
        total_orders: 0,
      },
      revenue: {
        total_order_value_eur: 0,
      },
      operations: {
        active_seeding_batches: 0,
        pending_follow_ups: 0,
      },
      alerts: {
        seed_reorder_alerts: 0,
        package_reorder_alerts: 0,
      },
      customer_funnel: {
        prospects: 0,
        active: 0,
        conversion_rate_percent: 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
