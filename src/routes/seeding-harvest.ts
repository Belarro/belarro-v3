import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// POST /seeding - Create seeding batch
router.post('/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crop_id, quantity_trays, batch_type } = req.body;

    // Validate required fields
    if (!crop_id || quantity_trays === undefined || !batch_type) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields', {
        required: ['crop_id', 'quantity_trays', 'batch_type'],
      });
    }

    // Validate batch_type
    if (!['order', 'sample'].includes(batch_type)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'batch_type must be "order" or "sample"');
    }

    // Validate quantity_trays
    if (quantity_trays <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'quantity_trays must be positive');
    }

    // Check crop exists
    const crop = await prisma.crop.findUnique({
      where: { id: crop_id },
      include: { seed_inventory: true },
    });
    if (!crop || !crop.seed_inventory) {
      throw new ApiError(404, 'NOT_FOUND', `Crop with ID ${crop_id} not found`);
    }

    // Calculate seeds needed
    const seedsNeeded = crop.seeds_per_tray * quantity_trays;

    // Check sufficient seed inventory
    if (crop.seed_inventory.quantity_grams < seedsNeeded) {
      throw new ApiError(400, 'INSUFFICIENT_INVENTORY', 'Not enough seeds in inventory', {
        needed: seedsNeeded,
        available: crop.seed_inventory.quantity_grams,
        shortage: seedsNeeded - crop.seed_inventory.quantity_grams,
      });
    }

    // Calculate expected harvest date
    const seedingDate = new Date();
    const expectedHarvestDate = new Date(seedingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + crop.total_growth_days);

    // Deduct seeds from inventory (transactional)
    const batch = await prisma.$transaction(async (tx) => {
      // Create seeding batch
      const newBatch = await tx.seedingBatch.create({
        data: {
          crop_id,
          seeding_date: seedingDate,
          quantity_trays,
          batch_type,
          expected_harvest_date: expectedHarvestDate,
        },
        include: {
          crop: {
            select: {
              id: true,
              name_en: true,
              name_de: true,
              seeds_per_tray: true,
              total_growth_days: true,
            },
          },
        },
      });

      // Deduct seeds from inventory
      await tx.seedInventory.update({
        where: { id: crop.seed_inventory!.id },
        data: {
          quantity_grams: crop.seed_inventory!.quantity_grams - seedsNeeded,
        },
      });

      return newBatch;
    });

    res.status(201).json({
      success: true,
      data: batch,
      message: 'Seeding batch created successfully',
      details: {
        seeds_deducted_grams: seedsNeeded,
        remaining_seed_inventory: crop.seed_inventory.quantity_grams - seedsNeeded,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /seeding/batches - List seeding batches
router.get('/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crop_id, batch_type, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (crop_id) where.crop_id = crop_id as string;
    if (batch_type) where.batch_type = batch_type as string;

    const [batches, total] = await Promise.all([
      prisma.seedingBatch.findMany({
        where,
        include: {
          crop: {
            select: {
              id: true,
              name_en: true,
              name_de: true,
            },
          },
          harvest_record: true,
        },
        skip,
        take: limitNum,
        orderBy: { seeding_date: 'desc' },
      }),
      prisma.seedingBatch.count({ where }),
    ]);

    res.json({
      success: true,
      data: batches,
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

// GET /seeding/batches/:id - Get single seeding batch
router.get('/batches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const batch = await prisma.seedingBatch.findUnique({
      where: { id },
      include: {
        crop: true,
        harvest_record: true,
      },
    });

    if (!batch) {
      throw new ApiError(404, 'NOT_FOUND', `Seeding batch with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: batch,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /harvest - Record harvest
router.post('/harvest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seeding_batch_id, actual_yield_grams, yield_used_for_orders_grams } = req.body;

    // Validate required fields
    if (!seeding_batch_id || actual_yield_grams === undefined || yield_used_for_orders_grams === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields', {
        required: ['seeding_batch_id', 'actual_yield_grams', 'yield_used_for_orders_grams'],
      });
    }

    // Validate numeric fields
    if (actual_yield_grams <= 0 || yield_used_for_orders_grams < 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Yields must be non-negative');
    }

    // Validate allocation logic: orders cannot exceed total yield
    if (yield_used_for_orders_grams > actual_yield_grams) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Yield used for orders cannot exceed actual yield', {
        actual: actual_yield_grams,
        used_for_orders: yield_used_for_orders_grams,
      });
    }

    // Check seeding batch exists
    const batch = await prisma.seedingBatch.findUnique({
      where: { id: seeding_batch_id },
      include: { crop: true },
    });
    if (!batch || !batch.crop) {
      throw new ApiError(404, 'NOT_FOUND', `Seeding batch with ID ${seeding_batch_id} not found`);
    }

    // Check no existing harvest record
    const existingHarvest = await prisma.harvestRecord.findFirst({
      where: { seeding_batch_id },
    });
    if (existingHarvest) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Harvest already recorded for this batch');
    }

    // Calculate yield available for samples
    const yield_available_samples = actual_yield_grams - yield_used_for_orders_grams;

    // Record harvest (transactional)
    const harvest = await prisma.$transaction(async (tx) => {
      // Create harvest record
      const harvestRecord = await tx.harvestRecord.create({
        data: {
          seeding_batch_id,
          harvest_date: new Date(),
          actual_yield_grams,
          yield_used_for_orders_grams,
          yield_available_samples_grams: yield_available_samples,
        },
        include: {
          seeding_batch: {
            select: {
              id: true,
              crop_id: true,
              batch_type: true,
            },
          },
        },
      });

      // Update sample inventory if batch_type is 'sample'
      if (batch.batch_type === 'sample') {
        await tx.sampleInventory.update({
          where: { crop_id: batch.crop_id },
          data: {
            available_grams: {
              increment: yield_available_samples,
            },
          },
        });
      }

      return harvestRecord;
    });

    res.status(201).json({
      success: true,
      data: harvest,
      message: 'Harvest recorded successfully',
      details: {
        actual_yield_grams,
        allocated_to_orders_grams: yield_used_for_orders_grams,
        allocated_to_samples_grams: yield_available_samples,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /harvest - List harvest records
router.get('/harvest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seeding_batch_id, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = seeding_batch_id ? { seeding_batch_id: seeding_batch_id as string } : {};

    const [harvests, total] = await Promise.all([
      prisma.harvestRecord.findMany({
        where,
        include: {
          seeding_batch: {
            select: {
              id: true,
              crop_id: true,
              batch_type: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { harvest_date: 'desc' },
      }),
      prisma.harvestRecord.count({ where }),
    ]);

    res.json({
      success: true,
      data: harvests,
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

// GET /harvest/:id - Get single harvest record
router.get('/harvest/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const harvest = await prisma.harvestRecord.findUnique({
      where: { id },
      include: {
        seeding_batch: true,
      },
    });

    if (!harvest) {
      throw new ApiError(404, 'NOT_FOUND', `Harvest record with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: harvest,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
