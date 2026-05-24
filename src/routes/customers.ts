import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /customers - List customers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status: status as string } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          visits: true,
          orders: true,
          follow_ups: true,
        },
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
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

// GET /customers/:id - Get single customer
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { visit_date: 'desc' },
        },
        orders: {
          include: {
            variant: {
              select: {
                id: true,
                size_name: true,
                crop: {
                  select: {
                    id: true,
                    name_en: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        follow_ups: {
          orderBy: { due_date: 'asc' },
        },
      },
    });

    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: customer,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /customers - Create new customer
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      address,
      city,
      email,
      whatsapp,
      phone,
      net_days,
    } = req.body;

    // Validate required fields
    if (!name || !email || !address || !city) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields', {
        required: ['name', 'email', 'address', 'city'],
      });
    }

    // Validate net_days if provided
    if (net_days !== undefined && net_days <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'net_days must be positive');
    }

    const firstContactDate = new Date();

    // Create customer and auto-generate 5 follow-ups (transactional)
    const customer = await prisma.$transaction(async (tx) => {
      // Create customer
      const newCustomer = await tx.customer.create({
        data: {
          name,
          address,
          city,
          email,
          whatsapp: whatsapp || null,
          phone: phone || null,
          status: 'prospect',
          net_days: net_days || 30,
          first_contact_date: firstContactDate,
        },
      });

      // Auto-generate 5 follow-ups
      const followUpDays = [0, 3, 7, 14, 30];
      const followUps = await Promise.all(
        followUpDays.map((days, index) => {
          const dueDate = new Date(firstContactDate);
          dueDate.setDate(dueDate.getDate() + days);
          return tx.followUp.create({
            data: {
              customer_id: newCustomer.id,
              follow_up_number: index + 1,
              follow_up_days: days,
              due_date: dueDate,
              status: 'pending',
              sent_via: null,
            },
          });
        })
      );

      return { ...newCustomer, follow_ups: followUps };
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully with 5 auto-generated follow-ups',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /customers/:id - Update customer
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updateData = req.body;

    // Check customer exists
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${id} not found`);
    }

    // Validate net_days if provided
    if (updateData.net_days !== undefined && updateData.net_days <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'net_days must be positive');
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        visits: true,
        orders: true,
        follow_ups: true,
      },
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /customers/:id - Delete customer
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: true,
        visits: true,
        follow_ups: true,
      },
    });

    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${id} not found`);
    }

    // Delete customer (cascade will handle orders, visits, follow-ups)
    await prisma.customer.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      details: {
        customer_id: id,
        orders_deleted: customer.orders.length,
        visits_deleted: customer.visits.length,
        follow_ups_deleted: customer.follow_ups.length,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
