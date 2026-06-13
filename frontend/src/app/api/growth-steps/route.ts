import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://qciccimnfvloklqlhvvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaWNjaW1uZnZsb2tscWxodnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU0MjAwMDAsImV4cCI6MTk5MDAwMDAwMH0.test-key-placeholder';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('cropId') || searchParams.get('crop_id');

    if (!cropId) {
      return NextResponse.json(
        { success: false, error: 'cropId is required' },
        { status: 400 }
      );
    }

    const fetchUrl = `${SUPABASE_URL}/rest/v1/growth_steps?crop_id=eq.${cropId}&order=step_order.asc`;

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

    const steps = await response.json();

    return NextResponse.json({
      success: true,
      data: steps,
    });
  } catch (error) {
    console.error('Growth steps GET error:', error);
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
        { success: false, error: 'crop_id and step_type are required' },
        { status: 400 }
      );
    }

    const fetchUrl = `${SUPABASE_URL}/rest/v1/growth_steps`;

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        crop_id,
        step_type,
        duration_hours: duration_hours || 0,
        notes: notes || '',
        step_order: step_order || 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Supabase error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const newStep = await response.json();

    return NextResponse.json(
      { success: true, data: newStep[0] || newStep },
      { status: 201 }
    );
  } catch (error) {
    console.error('Growth steps POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, step_type, duration_hours, notes, completed, completed_at } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const fetchUrl = `${SUPABASE_URL}/rest/v1/growth_steps?id=eq.${id}`;

    const updateData: Record<string, any> = {};
    if (step_type !== undefined) updateData.step_type = step_type;
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;
    if (completed_at !== undefined) updateData.completed_at = completed_at;

    const response = await fetch(fetchUrl, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Supabase error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const updated = await response.json();

    return NextResponse.json({
      success: true,
      data: updated[0] || updated,
    });
  } catch (error) {
    console.error('Growth steps PUT error:', error);
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
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const fetchUrl = `${SUPABASE_URL}/rest/v1/growth_steps?id=eq.${stepId}`;

    const response = await fetch(fetchUrl, {
      method: 'DELETE',
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

    return NextResponse.json({
      success: true,
      data: { id: stepId, deleted: true },
    });
  } catch (error) {
    console.error('Growth steps DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
