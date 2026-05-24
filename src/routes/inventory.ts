import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /inventory/seeds - List seed inventory
router.get('/seeds', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crop_id, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = crop_id ? { crop_id: crop_id as string } : {};

    const [seeds, total] = await Promise.all([
      prisma.seedInventory.findMany({
        where,
        include: {
          crop: {
            select: {
              id: true,
              name_en: true,
              name_de: true,
              seeds_per_tray: true,
            },
          },
        },
        skip,
        take: limitNum,
      }),
      prisma.seedInventory.count({ where }),
    ]);

    // Calculate remaining trays and reorder status
    const enriched = seeds.map((inv) => ({
      ...inv,
      remaining_trays: Math.floor(inv.quantity_grams / inv.crop.seeds_per_tray),
      needs_reorder: Math.floor(inv.quantity_grams / inv.crop.seeds_per_tray) < inv.reorder_threshold_trays,
    }));

    res.json({
      success: true,
      data: enriched,
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

// GET /inventory/seeds/:crop_id - Get seed inventory for crop
router.get('/seeds/:crop_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop_id = Array.isArray(req.params.crop_id) ? req.params.crop_id[0] : req.params.crop_id;

    const inventory = await prisma.seedInventory.findUnique({
      where: { crop_id },
      include: {
        crop: {
          select: {
            id: true,
            name_en: true,
            name_de: true,
            seeds_per_tray: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new ApiError(404, 'NOT_FOUND', `Seed inventory not found for crop ${crop_id}`);
    }

    const remaining_trays = Math.floor(inventory.quantity_grams / inventory.crop.seeds_per_tray);

    res.json({
      success: true,
      data: {
        ...inventory,
        remaining_trays,
        needs_reorder: remaining_trays < inventory.reorder_threshold_trays,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /inventory/seeds/:crop_id - Update seed inventory
router.put('/seeds/:crop_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop_id = Array.isArray(req.params.crop_id) ? req.params.crop_id[0] : req.params.crop_id;
    const { quantity_grams, reorder_threshold_trays } = req.body;

    // Check inventory exists
    const existing = await prisma.seedInventory.findUnique({
      where: { crop_id },
    });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Seed inventory not found for crop ${crop_id}`);
    }

    // Validate if provided
    if (quantity_grams !== undefined && quantity_grams < 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'quantity_grams cannot be negative');
    }
    if (reorder_threshold_trays !== undefined && reorder_threshold_trays <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'reorder_threshold_trays must be positive');
    }

    const inventory = await prisma.seedInventory.update({
      where: { crop_id },
      data: {
        ...(quantity_grams !== undefined && { quantity_grams }),
        ...(reorder_threshold_trays !== undefined && { reorder_threshold_trays }),
      },
      include: {
        crop: {
          select: {
            id: true,
            name_en: true,
            name_de: true,
            seeds_per_tray: true,
          },
        },
      },
    });

    const remaining_trays = Math.floor(inventory.quantity_grams / inventory.crop.seeds_per_tray);

    res.json({
      success: true,
      data: {
        ...inventory,
        remaining_trays,
        needs_reorder: remaining_trays < inventory.reorder_threshold_trays,
      },
      message: 'Seed inventory updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /inventory/packages - List package inventory
router.get('/packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variant_id, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = variant_id ? { variant_id: variant_id as string } : {};

    const [packages, total] = await Promise.all([
      prisma.packageInventory.findMany({
        where,
        include: {
          variant: {
            select: {
              id: true,
              size_name: true,
              size_grams: true,
              crop: {
                select: {
                  id: true,
                  name_en: true,
                },
              },
            },
          },
        },
        skip,
        take: limitNum,
      }),
      prisma.packageInventory.count({ where }),
    ]);

    // Add reorder status
    const enriched = packages.map((inv) => ({
      ...inv,
      needs_reorder: inv.quantity_available < inv.reorder_threshold,
    }));

    res.json({
      success: true,
      data: enriched,
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

// GET /inventory/packages/:variant_id - Get package inventory for variant
router.get('/packages/:variant_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant_id = Array.isArray(req.params.variant_id)
      ? req.params.variant_id[0]
      : req.params.variant_id;

    const inventory = await prisma.packageInventory.findUnique({
      where: { variant_id },
      include: {
        variant: {
          select: {
            id: true,
            size_name: true,
            size_grams: true,
            crop: {
              select: {
                id: true,
                name_en: true,
              },
            },
          },
        },
      },
    });

    if (!inventory) {
      throw new ApiError(404, 'NOT_FOUND', `Package inventory not found for variant ${variant_id}`);
    }

    res.json({
      success: true,
      data: {
        ...inventory,
        needs_reorder: inventory.quantity_available < inventory.reorder_threshold,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /inventory/packages/:variant_id - Update package inventory
router.put('/packages/:variant_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant_id = Array.isArray(req.params.variant_id)
      ? req.params.variant_id[0]
      : req.params.variant_id;
    const { quantity_available, reorder_threshold } = req.body;

    // Check inventory exists
    const existing = await prisma.packageInventory.findUnique({
      where: { variant_id },
    });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Package inventory not found for variant ${variant_id}`);
    }

    // Validate if provided
    if (quantity_available !== undefined && quantity_available < 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'quantity_available cannot be negative');
    }
    if (reorder_threshold !== undefined && reorder_threshold <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'reorder_threshold must be positive');
    }

    const inventory = await prisma.packageInventory.update({
      where: { variant_id },
      data: {
        ...(quantity_available !== undefined && { quantity_available }),
        ...(reorder_threshold !== undefined && { reorder_threshold }),
      },
      include: {
        variant: {
          select: {
            id: true,
            size_name: true,
            size_grams: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...inventory,
        needs_reorder: inventory.quantity_available < inventory.reorder_threshold,
      },
      message: 'Package inventory updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /inventory/samples - List sample inventory
router.get('/samples', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crop_id, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = crop_id ? { crop_id: crop_id as string } : {};

    const [samples, total] = await Promise.all([
      prisma.sampleInventory.findMany({
        where,
        include: {
          crop: {
            select: {
              id: true,
              name_en: true,
              name_de: true,
            },
          },
        },
        skip,
        take: limitNum,
      }),
      prisma.sampleInventory.count({ where }),
    ]);

    res.json({
      success: true,
      data: samples,
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

// GET /inventory/samples/:crop_id - Get sample inventory for crop
router.get('/samples/:crop_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop_id = Array.isArray(req.params.crop_id) ? req.params.crop_id[0] : req.params.crop_id;

    const inventory = await prisma.sampleInventory.findUnique({
      where: { crop_id },
      include: {
        crop: {
          select: {
            id: true,
            name_en: true,
            name_de: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new ApiError(404, 'NOT_FOUND', `Sample inventory not found for crop ${crop_id}`);
    }

    res.json({
      success: true,
      data: inventory,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /inventory/samples/:crop_id - Update sample inventory
router.put('/samples/:crop_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop_id = Array.isArray(req.params.crop_id) ? req.params.crop_id[0] : req.params.crop_id;
    const { available_grams } = req.body;

    // Check inventory exists
    const existing = await prisma.sampleInventory.findUnique({
      where: { crop_id },
    });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Sample inventory not found for crop ${crop_id}`);
    }

    // Validate if provided
    if (available_grams !== undefined && available_grams < 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'available_grams cannot be negative');
    }

    const inventory = await prisma.sampleInventory.update({
      where: { crop_id },
      data: {
        ...(available_grams !== undefined && { available_grams }),
      },
      include: {
        crop: {
          select: {
            id: true,
            name_en: true,
            name_de: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: inventory,
      message: 'Sample inventory updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
