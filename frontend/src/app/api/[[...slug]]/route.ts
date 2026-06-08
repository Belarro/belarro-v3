import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: [],
    message: 'Endpoint stub - data from V2 Supabase via /api/crops and /api/variants',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: null,
    message: 'POST not implemented - use V2 Supabase directly',
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: null,
    message: 'PUT not implemented - use V2 Supabase directly',
  });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: null,
    message: 'DELETE not implemented - use V2 Supabase directly',
  });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: null,
    message: 'PATCH not implemented - use V2 Supabase directly',
  });
}
