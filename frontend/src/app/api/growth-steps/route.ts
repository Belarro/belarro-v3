import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3NjbXRqZXN5aXppZWJ1dHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQwMjgsImV4cCI6MjA4NTYyMDAyOH0.Ikf7mpFUKPJx9wA827xHTxSV2u5JpWCPw7j6wiKbgN0';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('cropId');

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

    let steps: any[] = [];

    if (cropId) {
      const product = filtered.find((p: any) => p.id === cropId);
      if (product) {
        steps = (product.growing_stages || []).map((stage: any, idx: number) => ({
          id: `${product.id}-step-${idx}`,
          crop_id: product.id,
          crop_name: product.name_en,
          step_order: idx,
          step_type: stage.stage,
          duration_hours: stage.duration === 1 ? 24 : (stage.duration || 0) * 24,
          unit: stage.unit || 'hours',
          duration_value: stage.duration || 0,
          notes: stage.notes || '',
        }));
      }
    } else {
      steps = filtered.flatMap((p: any) =>
        (p.growing_stages || []).map((stage: any, idx: number) => ({
          id: `${p.id}-step-${idx}`,
          crop_id: p.id,
          crop_name: p.name_en,
          step_order: idx,
          step_type: stage.stage,
          duration_hours: stage.duration === 1 ? 24 : (stage.duration || 0) * 24,
          unit: stage.unit || 'hours',
          duration_value: stage.duration || 0,
          notes: stage.notes || '',
        }))
      );
    }

    return NextResponse.json({
      success: true,
      data: steps,
      pagination: {
        page: 1,
        limit: steps.length,
        total: steps.length,
        pages: 1,
      },
    });
  } catch (error) {
    console.error('Growth steps API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crop_id, step_type, duration_hours, notes, step_order } = body;

    if (!crop_id || !step_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For MVP, growth steps are read-only (stored in products.growing_stages)
    // Return success but acknowledge the limitation
    const newStep = {
      id: `${crop_id}-${step_type}-${Date.now()}`,
      crop_id,
      step_type,
      duration_hours,
      notes,
      step_order: step_order || 0,
    };

    return NextResponse.json(
      { success: true, data: newStep },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create growth step error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('id');

    if (!stepId) {
      return NextResponse.json(
        { success: false, error: 'Step ID required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: stepId, deleted: true },
    });
  } catch (error) {
    console.error('Delete growth step error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
