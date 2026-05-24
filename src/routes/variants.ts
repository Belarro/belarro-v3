import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /variants - List all variants
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crop_id, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = crop_id ? { crop_id: crop_id as string } : {};

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        include: {
          crop: {
            select: {
              id: true,
              name_en: true,
              name_de: true,
            },
          },
          package_inventory: true,
        },
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
      prisma.productVariant.count({ where }),
    ]);

    res.json({
      success: true,
      data: variants,
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

// GET /variants/:id - Get single variant
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        crop: true,
        package_inventory: true,
      },
    });

    if (!variant) {
      throw new ApiError(404, 'NOT_FOUND', `Variant with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: variant,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /variants - Create new variant
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crop_id, size_name, size_grams, price_eur, container_qty } = req.body;

    // Validate required fields
    if (!crop_id || !size_name || size_grams === undefined || price_eur === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields', {
        required: ['crop_id', 'size_name', 'size_grams', 'price_eur'],
      });
    }

    // Validate numeric fields
    if (size_grams <= 0 || price_eur <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'size_grams and price_eur must be positive');
    }

    // Check if crop exists
    const crop = await prisma.crop.findUnique({ where: { id: crop_id } });
    if (!crop) {
      throw new ApiError(404, 'NOT_FOUND', `Crop with ID ${crop_id} not found`);
    }

    const variant = await prisma.productVariant.create({
      data: {
        crop_id,
        size_name,
        size_grams,
        price_eur,
        container_qty: container_qty || null,
        package_inventory: {
          create: {
            quantity_available: 0,
            reorder_threshold: 20,
          },
        },
      },
      include: {
        crop: {
          select: {
            id: true,
            name_en: true,
            name_de: true,
          },
        },
        package_inventory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: variant,
      message: 'Variant created successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /variants/:id - Update variant
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate numeric fields if provided
    if ((updateData.price_eur && updateData.price_eur <= 0) || (updateData.size_grams && updateData.size_grams <= 0)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'price_eur and size_grams must be positive');
    }

    // Check if variant exists
    const existing = await prisma.productVariant.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Variant with ID ${id} not found`);
    }

    const variant = await prisma.productVariant.update({
      where: { id },
      data: updateData,
      include: {
        crop: {
          select: {
            id: true,
            name_en: true,
            name_de: true,
          },
        },
        package_inventory: true,
      },
    });

    res.json({
      success: true,
      data: variant,
      message: 'Variant updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /variants/:id - Delete variant
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new ApiError(404, 'NOT_FOUND', `Variant with ID ${id} not found`);
    }

    // Delete variant (cascade will handle related data)
    await prisma.productVariant.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Variant deleted successfully',
      details: {
        variant_id: id,
        crop_id: variant.crop_id,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
