import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse, upload } from '../index';
import { uploadCropPhoto, deleteCropPhoto } from '../services/supabase';

const router = Router();

// DEPRECATED: Use Supabase products table instead

// GET /crops - List all crops from Supabase products table
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[CROPS GET /] Handler called');

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const { status } = req.query;

    console.log('[CROPS] URL:', supabaseUrl);
    console.log('[CROPS] Key length:', anonKey?.length);
    console.log('[CROPS] Status:', status);

    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    const fetchUrl = `${supabaseUrl}/rest/v1/products?select=*&order=sort_order`;
    console.log('[CROPS] Fetching:', fetchUrl);

    const response = await fetch(fetchUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    console.log('[CROPS] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${errorText}`);
    }

    const products = (await response.json()) as any[];
    console.log('[CROPS] Got', products.length, 'products from Supabase');

    // Show all non-hidden products (available + paused, excluding hidden)
    let filtered = products.filter((p: any) => p.availability_status !== 'hidden');

    console.log('[CROPS] After filtering (non-hidden):', filtered.length, 'products');

    const crops = filtered.map((p: any) => ({
      id: p.id,
      name_en: p.name_en || p.name,
      name_de: p.name_de,
      flavor: p.flavor_profile,
      photo_url: p.photo,
      seeds_per_tray: p.growing_procedure?.seeds_per_tray || 0,
      yield_per_tray: p.yield_per_tray ? parseFloat(p.yield_per_tray) : 0,
      total_growth_days: 14,
      seeding_schedule: 'TUESDAY',
      status: p.availability_status === 'available' ? 'active' : (p.availability_status === 'paused' ? 'paused' : 'inactive'),
      created_at: p.created_at,
      updated_at: p.updated_at,
      variants: p.available_sizes?.map((size: string) => ({
        id: p.id + '-' + size,
        size_name: size,
        size_grams: parseFloat(size) || 0,
        price_eur: p.prices?.[size] || 0,
      })) || [],
      growth_steps: p.growing_stages || [],
      seed_inventory: [],
    }));

    console.log('[CROPS] Returning', crops.length, 'crops');

    res.json({
      success: true,
      data: crops,
      pagination: {
        page: 1,
        limit: crops.length,
        total: crops.length,
        pages: 1,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[CROPS] Error:', error instanceof Error ? error.message : String(error));
    next(error);
  }
});

// GET /crops/for-chefs - For external sites (for-chefs.html)
// Returns crops in format expected by for-chefs page
router.get('/for-chefs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crops = await prisma.crop.findMany({
      where: { status: 'active' },
      include: { variants: true },
      orderBy: { created_at: 'desc' },
    });

    const products = crops.map((crop, idx) => ({
      id: crop.id,
      name: crop.name_en,
      flavor_profile: crop.flavor,
      photo: crop.photo_url,
      category: 'microgreen',
      availability_status: 'visible',
      sort_order: idx + 1,
      available_sizes: crop.variants.map(v => v.size_name).sort(),
      prices: Object.fromEntries(crop.variants.map(v => [v.size_name, v.price_eur])),
    }));

    res.json({
      success: true,
      data: products,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /crops/upload-photo/:id - Upload crop photo to Supabase Storage
router.post('/upload-photo/:id', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if crop exists
    const crop = await prisma.crop.findUnique({ where: { id } });
    if (!crop) {
      throw new ApiError(404, 'NOT_FOUND', `Crop with ID ${id} not found`);
    }

    // Get file from request (multer)
    const file = (req as any).file;
    if (!file) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'No file uploaded');
    }

    // Upload to Supabase Storage
    const photoUrl = await uploadCropPhoto(id, file.buffer, file.mimetype);

    // Delete old photo if exists
    if (crop.photo_url) {
      await deleteCropPhoto(crop.photo_url);
    }

    // Store URL in database
    const updated = await prisma.crop.update({
      where: { id },
      data: { photo_url: photoUrl },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Photo uploaded successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /crops/:id - Get single crop
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const crop = await prisma.crop.findUnique({
      where: { id },
      include: {
        variants: true,
        seed_inventory: true,
        sample_inventory: true,
        growth_steps: { orderBy: { step_order: 'asc' } },
      },
    });

    if (!crop) {
      throw new ApiError(404, 'NOT_FOUND', `Crop with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: crop,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /crops - Create new crop
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name_en,
      name_de,
      flavor,
      flavor_de,
      photo_url,
      seeds_per_tray,
      yield_per_tray,
      total_growth_days,
      seeding_schedule,
      status,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'name_en',
      'name_de',
      'seeds_per_tray',
      'yield_per_tray',
      'total_growth_days',
      'seeding_schedule',
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields', {
        missing: missingFields,
      });
    }

    // Validate seeding_schedule
    if (!['TUESDAY', 'FRIDAY'].includes(seeding_schedule)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Invalid seeding_schedule. Must be TUESDAY or FRIDAY'
      );
    }

    // Validate numbers
    if (seeds_per_tray <= 0 || yield_per_tray <= 0 || total_growth_days <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'All numeric fields must be positive');
    }

    const crop = await prisma.crop.create({
      data: {
        name_en,
        name_de,
        flavor: flavor || null,
        flavor_de: flavor_de || null,
        photo_url: photo_url || null,
        seeds_per_tray,
        yield_per_tray,
        total_growth_days,
        seeding_schedule,
        status: status || 'active',
        seed_inventory: {
          create: {
            quantity_grams: 0,
            reorder_threshold_trays: 20,
          },
        },
        sample_inventory: {
          create: {
            available_grams: 0,
          },
        },
      },
      include: {
        seed_inventory: true,
        sample_inventory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: crop,
      message: 'Crop created successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /crops/:id - Update crop
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updateData = req.body;

    // Validate seeding_schedule if provided
    if (updateData.seeding_schedule && !['TUESDAY', 'FRIDAY'].includes(updateData.seeding_schedule)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Invalid seeding_schedule. Must be TUESDAY or FRIDAY'
      );
    }

    // Validate numeric fields if provided
    if (
      (updateData.seeds_per_tray && updateData.seeds_per_tray <= 0) ||
      (updateData.yield_per_tray && updateData.yield_per_tray <= 0) ||
      (updateData.total_growth_days && updateData.total_growth_days <= 0)
    ) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'All numeric fields must be positive');
    }

    // Check if crop exists
    const existing = await prisma.crop.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Crop with ID ${id} not found`);
    }

    const crop = await prisma.crop.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
        seed_inventory: true,
        sample_inventory: true,
      },
    });

    res.json({
      success: true,
      data: crop,
      message: 'Crop updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /crops/:id - Delete crop
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if crop exists
    const crop = await prisma.crop.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!crop) {
      throw new ApiError(404, 'NOT_FOUND', `Crop with ID ${id} not found`);
    }

    // Delete crop (cascade will handle related data)
    await prisma.crop.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Crop deleted successfully',
      details: {
        crop_id: id,
        variants_deleted: crop.variants?.length || 0,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
