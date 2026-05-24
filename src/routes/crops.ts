import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /crops - List all crops
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'active', page = '1', limit = '20' } = req.query;

    // Validate status
    const validStatuses = ['active', 'paused', 'inactive', 'all'];
    if (!validStatuses.includes(status as string)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid status value', {
        allowed: validStatuses,
      });
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where = status === 'all' ? {} : { status: status as string };

    const [crops, total] = await Promise.all([
      prisma.crop.findMany({
        where,
        include: {
          variants: true,
          seed_inventory: true,
        },
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
      prisma.crop.count({ where }),
    ]);

    res.json({
      success: true,
      data: crops,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
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
      photo_url,
      seeds_per_tray,
      yield_per_tray,
      total_growth_days,
      seeding_schedule,
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
        photo_url: photo_url || null,
        seeds_per_tray,
        yield_per_tray,
        total_growth_days,
        seeding_schedule,
        status: 'active',
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
