import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('id');

    if (cropId) {
      const { data: crop, error } = await supabaseAdmin
        .from('belarro_v3_crop')
        .select('*, growth_procedure:belarro_v3_growth_procedure(*), variants:belarro_v3_product_variant(*)')
        .eq('id', cropId)
        .is('deleted_at', null)
        .single();

      if (error || !crop) {
        return NextResponse.json(
          { success: false, error: error?.message || 'Crop not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: crop });
    }

    const { data: crops, error } = await supabaseAdmin
      .from('belarro_v3_crop')
      .select('*, growth_procedure:belarro_v3_growth_procedure(*), variants:belarro_v3_product_variant(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: crops || [] });
  } catch (error) {
    console.error('Crops API GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name_en, name_de, flavor, status, growth_procedure, variants } = body;

    if (!name_en || !name_de) {
      return NextResponse.json(
        { success: false, error: 'name_en and name_de are required' },
        { status: 400 }
      );
    }

    // Create crop
    const { data: crop, error: cropError } = await supabaseAdmin
      .from('belarro_v3_crop')
      .insert([
        {
          name_en,
          name_de,
          flavor: flavor || null,
          status: status || 'active',
        },
      ])
      .select()
      .single();

    if (cropError || !crop) {
      return NextResponse.json(
        { success: false, error: cropError?.message || 'Failed to create crop' },
        { status: 500 }
      );
    }

    // Create growth procedure if provided
    if (growth_procedure) {
      const { error: procError } = await supabaseAdmin
        .from('belarro_v3_growth_procedure')
        .insert([
          {
            crop_id: crop.id,
            soak_enabled: growth_procedure.soak_enabled || false,
            soak_hours: growth_procedure.soak_hours || null,
            cover_soil_enabled: growth_procedure.cover_soil_enabled || false,
            stack_enabled: growth_procedure.stack_enabled || false,
            stack_days: growth_procedure.stack_days || null,
            growth_env_type: growth_procedure.growth_env_type || 'light',
            growth_env_days: growth_procedure.growth_env_days || 0,
            humidity_dome_enabled: growth_procedure.humidity_dome_enabled || false,
          },
        ]);

      if (procError) {
        console.error('Growth procedure error:', procError);
      }
    }

    // Create variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantRecords = variants
        .filter(v => v.size_name && v.size_grams && v.price_eur)
        .map(v => ({
          crop_id: crop.id,
          size_name: v.size_name,
          size_grams: v.size_grams,
          price_eur: v.price_eur,
        }));

      if (variantRecords.length > 0) {
        const { error: varError } = await supabaseAdmin
          .from('belarro_v3_product_variant')
          .insert(variantRecords);

        if (varError) {
          console.error('Variants error:', varError);
        }
      }
    }

    // Fetch full crop with relations
    const { data: fullCrop, error: fetchError } = await supabaseAdmin
      .from('belarro_v3_crop')
      .select('*, growth_procedure:belarro_v3_growth_procedure(*), variants:belarro_v3_product_variant(*)')
      .eq('id', crop.id)
      .single();

    if (fetchError || !fullCrop) {
      return NextResponse.json({ success: true, data: crop }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: fullCrop }, { status: 201 });
  } catch (error) {
    console.error('Crops API POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name_en, name_de, flavor, status, growth_procedure, variants } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    // Update crop basics
    const updateData: any = {};
    if (name_en) updateData.name_en = name_en;
    if (name_de) updateData.name_de = name_de;
    if (flavor !== undefined) updateData.flavor = flavor;
    if (status) updateData.status = status;

    const { error: updateError } = await supabaseAdmin
      .from('belarro_v3_crop')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Update or create growth procedure
    if (growth_procedure) {
      const { data: existing } = await supabaseAdmin
        .from('belarro_v3_growth_procedure')
        .select()
        .eq('crop_id', id)
        .single();

      if (existing) {
        await supabaseAdmin
          .from('belarro_v3_growth_procedure')
          .update({
            soak_enabled: growth_procedure.soak_enabled || false,
            soak_hours: growth_procedure.soak_hours || null,
            cover_soil_enabled: growth_procedure.cover_soil_enabled || false,
            stack_enabled: growth_procedure.stack_enabled || false,
            stack_days: growth_procedure.stack_days || null,
            growth_env_type: growth_procedure.growth_env_type || 'light',
            growth_env_days: growth_procedure.growth_env_days || 0,
            humidity_dome_enabled: growth_procedure.humidity_dome_enabled || false,
          })
          .eq('crop_id', id);
      } else {
        await supabaseAdmin
          .from('belarro_v3_growth_procedure')
          .insert([
            {
              crop_id: id,
              soak_enabled: growth_procedure.soak_enabled || false,
              soak_hours: growth_procedure.soak_hours || null,
              cover_soil_enabled: growth_procedure.cover_soil_enabled || false,
              stack_enabled: growth_procedure.stack_enabled || false,
              stack_days: growth_procedure.stack_days || null,
              growth_env_type: growth_procedure.growth_env_type || 'light',
              growth_env_days: growth_procedure.growth_env_days || 0,
              humidity_dome_enabled: growth_procedure.humidity_dome_enabled || false,
            },
          ]);
      }
    }

    // Update variants (delete old, create new)
    if (variants && Array.isArray(variants)) {
      await supabaseAdmin
        .from('belarro_v3_product_variant')
        .delete()
        .eq('crop_id', id);

      if (variants.length > 0) {
        const variantRecords = variants
          .filter(v => v.size_name && v.size_grams && v.price_eur)
          .map(v => ({
            crop_id: id,
            size_name: v.size_name,
            size_grams: v.size_grams,
            price_eur: v.price_eur,
          }));

        if (variantRecords.length > 0) {
          await supabaseAdmin
            .from('belarro_v3_product_variant')
            .insert(variantRecords);
        }
      }
    }

    // Fetch full crop with relations
    const { data: fullCrop, error: fetchError } = await supabaseAdmin
      .from('belarro_v3_crop')
      .select('*, growth_procedure:belarro_v3_growth_procedure(*), variants:belarro_v3_product_variant(*)')
      .eq('id', id)
      .single();

    if (fetchError || !fullCrop) {
      return NextResponse.json({ success: true, data: { id } });
    }

    return NextResponse.json({ success: true, data: fullCrop });
  } catch (error) {
    console.error('Crops API PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('belarro_v3_crop')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Crops API DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
