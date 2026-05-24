import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// Helper: Calculate seeding date based on schedule
const calculateSeedingDate = (orderDate: Date, seeding_schedule: string): Date => {
  const date = new Date(orderDate);
  const dayOfWeek = date.getDay(); // 0=Sunday, 5=Friday, 2=Tuesday

  if (seeding_schedule === 'FRIDAY') {
    if (dayOfWeek === 5) {
      return date; // Already Friday
    } else {
      const daysUntilFriday = dayOfWeek > 5 ? 7 - dayOfWeek + 5 : 5 - dayOfWeek;
      const result = new Date(date);
      result.setDate(result.getDate() + daysUntilFriday);
      return result;
    }
  }

  if (seeding_schedule === 'TUESDAY') {
    if (dayOfWeek === 2) {
      return date; // Already Tuesday
    } else if (dayOfWeek > 2) {
      const daysUntilTuesday = 7 - dayOfWeek + 2;
      const result = new Date(date);
      result.setDate(result.getDate() + daysUntilTuesday);
      return result;
    } else {
      const result = new Date(date);
      result.setDate(result.getDate() + (2 - dayOfWeek));
      return result;
    }
  }

  return date;
};

// Helper: Calculate harvest date
const calculateHarvestDate = (seedingDate: Date, growthDays: number): Date => {
  const result = new Date(seedingDate);
  result.setDate(result.getDate() + growthDays);
  return result;
};

// Helper: Calculate next delivery date (Saturday following harvest)
const calculateNextDeliveryDate = (harvestDate: Date): Date => {
  const result = new Date(harvestDate);
  const dayOfWeek = result.getDay();
  const daysUntilSaturday = dayOfWeek <= 6 ? 6 - dayOfWeek : 0;
  result.setDate(result.getDate() + daysUntilSaturday);
  return result;
};

// GET /orders - List orders with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders: any[] = [];
    const total = 0;

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: 1,
        limit: 20,
        total,
        pages: 0,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /orders/:id - Get single order
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        variant: {
          include: {
            crop: true,
            package_inventory: true,
          },
        },
        fulfillments: {
          include: {
            harvest_record: {
              include: {
                seeding_batch: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', `Order with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: order,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /orders - Create new order
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, product_variant_id, quantity, recurring } = req.body;

    // Validate required fields
    if (!customer_id || !product_variant_id || quantity === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields', {
        required: ['customer_id', 'product_variant_id', 'quantity'],
      });
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'quantity must be positive');
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${customer_id} not found`);
    }

    // Check variant exists and get crop info
    const variant = await prisma.productVariant.findUnique({
      where: { id: product_variant_id },
      include: { crop: true },
    });
    if (!variant || !variant.crop) {
      throw new ApiError(404, 'NOT_FOUND', `Variant with ID ${product_variant_id} not found`);
    }

    const orderDate = new Date();
    const seedingDate = calculateSeedingDate(orderDate, variant.crop.seeding_schedule);
    const harvestDate = calculateHarvestDate(seedingDate, variant.crop.total_growth_days);
    const nextDeliveryDate = calculateNextDeliveryDate(harvestDate);

    const order = await prisma.order.create({
      data: {
        customer_id,
        product_variant_id,
        quantity,
        order_date: orderDate,
        seeding_date: seedingDate,
        expected_harvest_date: harvestDate,
        next_delivery_date: nextDeliveryDate,
        status: 'pending',
        recurring: recurring || false,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variant: {
          select: {
            id: true,
            size_name: true,
            size_grams: true,
            price_eur: true,
            crop: {
              select: {
                id: true,
                name_en: true,
                name_de: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /orders/:id - Update order
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updateData = req.body;

    // Validate quantity if provided
    if (updateData.quantity !== undefined && updateData.quantity <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'quantity must be positive');
    }

    // Check order exists
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Order with ID ${id} not found`);
    }

    // If status is being changed to 'fulfilled' or 'cancelled', prevent further updates
    if ((updateData.status === 'fulfilled' || updateData.status === 'cancelled') && existing.status !== updateData.status) {
      // Allow state transition, but no other fields
      if (Object.keys(updateData).length > 1) {
        throw new ApiError(
          400,
          'VALIDATION_ERROR',
          'Cannot modify other fields when changing to final status'
        );
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variant: {
          select: {
            id: true,
            size_name: true,
            size_grams: true,
            price_eur: true,
            crop: {
              select: {
                id: true,
                name_en: true,
                name_de: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /orders/:id - Delete order
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check order exists
    const order = await prisma.order.findUnique({
      where: { id },
      include: { fulfillments: true },
    });
    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', `Order with ID ${id} not found`);
    }

    // Prevent deletion if order has fulfillments
    if (order.fulfillments && order.fulfillments.length > 0) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Cannot delete order with fulfillments. Cancel instead.'
      );
    }

    await prisma.order.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Order deleted successfully',
      details: {
        order_id: id,
        customer_id: order.customer_id,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
