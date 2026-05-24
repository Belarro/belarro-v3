import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /standing-orders - List standing orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, status, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (customer_id) where.customer_id = customer_id as string;
    if (status) where.status = status as string;

    const [orders, total] = await Promise.all([
      prisma.standingOrder.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              variant: {
                select: { id: true, size_name: true, size_grams: true, price_eur: true },
              },
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
      prisma.standingOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
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

// GET /standing-orders/:id - Get single standing order
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.standingOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            variant: {
              select: { id: true, crop_id: true, size_name: true, size_grams: true, price_eur: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', `Standing order with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: order,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /standing-orders - Create standing order
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, notes, items } = req.body;

    // Validate
    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields: customer_id, items (array)');
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${customer_id} not found`);
    }

    // Validate all variants exist
    const variantIds = items.map((i: any) => i.variant_id);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
    });
    if (variants.length !== variantIds.length) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'One or more variants not found');
    }

    // Create standing order with items (transactional)
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.standingOrder.create({
        data: {
          customer_id,
          notes: notes || null,
          status: 'active',
        },
      });

      // Create order items
      const orderItems = await Promise.all(
        items.map((item: any) =>
          tx.standingOrderItem.create({
            data: {
              standing_order_id: newOrder.id,
              variant_id: item.variant_id,
              size_name: item.size_name,
              quantity: item.quantity || 1,
              price_at_time_eur: item.price_at_time_eur || 0,
              delivery_day_of_week: item.delivery_day_of_week || null,
            },
          })
        )
      );

      // Fetch complete order with items
      return tx.standingOrder.findUnique({
        where: { id: newOrder.id },
        include: {
          customer: true,
          items: {
            include: {
              variant: {
                select: { id: true, size_name: true, size_grams: true, price_eur: true },
              },
            },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Standing order created successfully',
      details: {
        items_count: items.length,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PATCH /standing-orders/:id - Update standing order
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = req.body;

    // Validate status
    if (status && !['active', 'paused', 'inactive'].includes(status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid status');
    }

    // Check order exists
    const existing = await prisma.standingOrder.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Standing order with ID ${id} not found`);
    }

    const order = await prisma.standingOrder.update({
      where: { id },
      data: {
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        customer: true,
        items: {
          include: {
            variant: {
              select: { id: true, size_name: true, size_grams: true, price_eur: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Standing order updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /standing-orders/:id - Delete standing order
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.standingOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', `Standing order with ID ${id} not found`);
    }

    // Delete cascade handles items
    await prisma.standingOrder.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Standing order deleted successfully',
      details: {
        order_id: id,
        items_deleted: order.items.length,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
