import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET /size-templates - List all size templates
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.sizeTemplate.findMany({
      orderBy: { size_grams: 'asc' },
    });

    res.json({
      success: true,
      data: templates,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /size-templates - Create new size template (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { size_name, size_grams, price_eur, description } = req.body;

    if (!size_name || size_grams === undefined || price_eur === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields: size_name, size_grams, price_eur');
    }

    if (size_grams <= 0 || price_eur <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'size_grams and price_eur must be positive');
    }

    const template = await prisma.sizeTemplate.create({
      data: {
        size_name,
        size_grams,
        price_eur,
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Size template created successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /size-templates/:id - Update size template (admin only)
router.put('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { size_name, size_grams, price_eur, description } = req.body;

    const existing = await prisma.sizeTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Size template with ID ${id} not found`);
    }

    if ((size_grams !== undefined && size_grams <= 0) || (price_eur !== undefined && price_eur <= 0)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'size_grams and price_eur must be positive');
    }

    const updated = await prisma.sizeTemplate.update({
      where: { id },
      data: {
        ...(size_name && { size_name }),
        ...(size_grams !== undefined && { size_grams }),
        ...(price_eur !== undefined && { price_eur }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Size template updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /size-templates/:id - Delete size template (admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const template = await prisma.sizeTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new ApiError(404, 'NOT_FOUND', `Size template with ID ${id} not found`);
    }

    await prisma.sizeTemplate.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Size template deleted successfully',
      details: { template_id: id },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
