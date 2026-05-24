import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /follow-ups - List follow-ups with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, status, follow_up_number, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (customer_id) where.customer_id = customer_id as string;
    if (status) where.status = status as string;
    if (follow_up_number) where.follow_up_number = parseInt(follow_up_number as string);

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true,
              phone: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { due_date: 'asc' },
      }),
      prisma.followUp.count({ where }),
    ]);

    res.json({
      success: true,
      data: followUps,
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

// GET /follow-ups/:id - Get single follow-up
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!followUp) {
      throw new ApiError(404, 'NOT_FOUND', `Follow-up with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: followUp,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /follow-ups/customer/:customer_id - Get all follow-ups for customer
router.get('/customer/:customer_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer_id = Array.isArray(req.params.customer_id)
      ? req.params.customer_id[0]
      : req.params.customer_id;

    // Check customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${customer_id} not found`);
    }

    const followUps = await prisma.followUp.findMany({
      where: { customer_id },
      orderBy: { follow_up_number: 'asc' },
    });

    res.json({
      success: true,
      data: followUps,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /follow-ups/:id - Update follow-up (mark as sent/completed)
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, sent_via } = req.body;

    // Check follow-up exists
    const existing = await prisma.followUp.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Follow-up with ID ${id} not found`);
    }

    // Validate status if provided
    if (status && !['pending', 'sent', 'completed'].includes(status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'status must be "pending", "sent", or "completed"');
    }

    // Validate sent_via if provided
    if (sent_via && !['whatsapp', 'email', 'call', 'visit'].includes(sent_via)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'sent_via must be "whatsapp", "email", "call", or "visit"'
      );
    }

    // Validation: if marking as sent/completed, sent_via must be provided
    if ((status === 'sent' || status === 'completed') && !sent_via) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'sent_via is required when status is sent or completed'
      );
    }

    const followUp = await prisma.followUp.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(sent_via && { sent_via }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: followUp,
      message: 'Follow-up updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /follow-ups/:customer_id/reschedule - Reschedule pending follow-ups
router.post('/:customer_id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer_id = Array.isArray(req.params.customer_id)
      ? req.params.customer_id[0]
      : req.params.customer_id;
    const { days_delay } = req.body;

    // Validate days_delay
    if (days_delay === undefined || days_delay <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'days_delay must be positive');
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${customer_id} not found`);
    }

    // Get pending follow-ups
    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        customer_id,
        status: 'pending',
      },
    });

    // Reschedule each pending follow-up
    const rescheduled = await Promise.all(
      pendingFollowUps.map((followUp) => {
        const newDueDate = new Date(followUp.due_date);
        newDueDate.setDate(newDueDate.getDate() + days_delay);
        return prisma.followUp.update({
          where: { id: followUp.id },
          data: { due_date: newDueDate },
        });
      })
    );

    res.json({
      success: true,
      data: rescheduled,
      message: 'Follow-ups rescheduled successfully',
      details: {
        count: rescheduled.length,
        days_delayed: days_delay,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /follow-ups/due/today - Get follow-ups due today
router.get('/due/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followUps = await prisma.followUp.findMany({
      where: {
        status: 'pending',
        due_date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            phone: true,
          },
        },
      },
      orderBy: { follow_up_number: 'asc' },
    });

    res.json({
      success: true,
      data: followUps,
      count: followUps.length,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
